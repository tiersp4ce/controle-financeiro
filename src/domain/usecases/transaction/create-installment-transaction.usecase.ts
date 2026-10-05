import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { Transaction } from '../../entities/transaction';
import { PaymentMethod, RecurrenceFrequency, TransactionType } from '../../enums';
import { addMonthsToDate, shiftMonthKey, toMonthKey } from '../../../core/utils/date';
import { calculateInvoiceCycle, getInvoiceDatesForMonth } from '../../../core/utils/credit-card-cycle';

/**
 * Modo de interpretação da data informada no parcelamento:
 * - 'PURCHASE_DATE': A data informada é o dia da compra original no passado.
 *   O vencimento de cada parcela i é projetado (i - 1) meses após a compra original.
 * - 'FIRST_INSTALLMENT': A data informada é a data de vencimento da primeira parcela restante a pagar.
 *   O offset é relativo à primeira parcela a pagar (i - startFrom). Fallback padrão e retrocompatível.
 */
export type InstallmentDateMode = 'PURCHASE_DATE' | 'FIRST_INSTALLMENT';

export interface CreateInstallmentInput {
  description: string;
  totalAmountCents: number;
  type: TransactionType;
  startDate: string; // ISO YYYY-MM-DD (data da compra original ou da primeira parcela a pagar)
  categoryId: string;
  paymentMethod: PaymentMethod;
  totalInstallments: number; // N >= 2
  startInstallmentNumber?: number; // Padrão: 1 (ex: 5 para começar da 5ª parcela de 12)
  dateMode?: InstallmentDateMode; // Padrão: 'FIRST_INSTALLMENT'
}

export class CreateInstallmentTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly settingsRepository?: ISettingsRepository
  ) {}

  async execute(input: CreateInstallmentInput): Promise<Transaction[]> {
    // BUG-02: Descrição não pode ser nula, vazia ou composta apenas de espaços em branco
    if (!input.description || !input.description.trim()) {
      throw new Error('A descrição da compra é obrigatória.');
    }

    if (input.totalInstallments < 2) {
      throw new Error('Número de parcelas deve ser no mínimo 2.');
    }
    if (input.totalAmountCents <= 0) {
      throw new Error('Valor total deve ser maior que zero.');
    }

    const cleanDescription = input.description.trim();
    const dateMode = input.dateMode ?? 'FIRST_INSTALLMENT';
    const startFrom = Math.max(1, Math.min(input.startInstallmentNumber ?? 1, input.totalInstallments));

    // Regra matemática financeira do projeto:
    // O valor base é a divisão inteira dos centavos. O resto é atribuído à 1ª parcela do lote gerado.
    const baseCents = Math.floor(input.totalAmountCents / input.totalInstallments);
    const remainderCents = input.totalAmountCents % input.totalInstallments;
    const firstInstallmentCents = baseCents + remainderCents;

    let cardConfig = null;
    if (input.type === TransactionType.EXPENSE && input.paymentMethod === PaymentMethod.CREDIT_CARD && this.settingsRepository) {
      const cfg = await this.settingsRepository.getCreditCardConfig();
      if (cfg && cfg.isEnabled) {
        cardConfig = cfg;
      }
    }

    // BUG-01: Determina a data original da compra e o ciclo de fatura base
    const purchaseDate = dateMode === 'PURCHASE_DATE'
      ? input.startDate
      : addMonthsToDate(input.startDate, -(startFrom - 1));

    let initialInvoiceMonth: string = toMonthKey(purchaseDate);
    if (cardConfig) {
      const cycle = calculateInvoiceCycle(purchaseDate, cardConfig.closingDay, cardConfig.dueDay);
      initialInvoiceMonth = cycle.invoiceMonth;
    }

    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const transactions: Transaction[] = [];
    const now = Date.now();

    for (let i = startFrom; i <= input.totalInstallments; i++) {
      const installmentAmount = i === startFrom ? firstInstallmentCents : baseCents;

      let installmentDate: string;
      let installmentInvoiceMonth: string;

      if (dateMode === 'PURCHASE_DATE') {
        // A parcela i ocorre (i - 1) meses após a compra original
        const offsetFromPurchase = i - 1;
        if (cardConfig) {
          installmentInvoiceMonth = shiftMonthKey(initialInvoiceMonth, offsetFromPurchase);
          installmentDate = getInvoiceDatesForMonth(
            installmentInvoiceMonth,
            cardConfig.closingDay,
            cardConfig.dueDay
          ).dueDate;
        } else {
          installmentDate = addMonthsToDate(purchaseDate, offsetFromPurchase);
          installmentInvoiceMonth = toMonthKey(installmentDate);
        }
      } else {
        // Modo FIRST_INSTALLMENT: deslocamento relativo à primeira parcela a pagar (i - startFrom)
        const offsetFromFirst = i - startFrom;
        if (cardConfig) {
          const firstCycle = calculateInvoiceCycle(input.startDate, cardConfig.closingDay, cardConfig.dueDay);
          installmentInvoiceMonth = shiftMonthKey(firstCycle.invoiceMonth, offsetFromFirst);
          installmentDate = getInvoiceDatesForMonth(
            installmentInvoiceMonth,
            cardConfig.closingDay,
            cardConfig.dueDay
          ).dueDate;
        } else {
          installmentDate = addMonthsToDate(input.startDate, offsetFromFirst);
          installmentInvoiceMonth = toMonthKey(installmentDate);
        }
      }

      const transaction: Transaction = {
        id: `tx_${now}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        description: `${cleanDescription} (${i}/${input.totalInstallments})`,
        amountCents: installmentAmount,
        type: input.type,
        date: installmentDate,
        categoryId: input.categoryId,
        paymentMethod: input.paymentMethod,
        recurrence: RecurrenceFrequency.NONE,
        installmentGroupId: groupId,
        installmentNumber: i,
        totalInstallments: input.totalInstallments,
        purchaseDate,
        invoiceMonth: installmentInvoiceMonth,
        isPaid: false,
        isAnticipated: false,
        createdAt: now + i,
      };

      transactions.push(transaction);
    }

    await this.transactionRepository.createMany(transactions);
    return transactions;
  }
}
