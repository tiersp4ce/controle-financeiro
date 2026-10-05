import { ITransactionRepository } from '../../repositories/transaction.repository';
import { Transaction } from '../../entities/transaction';
import { PaymentMethod, TransactionType } from '../../enums';

export interface AdvanceInstallmentItem {
  transactionId: string;
  discountCents?: number; // Desconto opcional concedido pela antecipação (em centavos inteiros)
}

export interface AdvanceInstallmentsInput {
  targetInvoiceMonth: string; // YYYY-MM para onde as parcelas serão movidas (mês atual)
  targetDate: string;         // ISO YYYY-MM-DD
  items: AdvanceInstallmentItem[];
}

export class AdvanceInstallmentsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(input: AdvanceInstallmentsInput): Promise<Transaction[]> {
    if (!input.targetInvoiceMonth || !input.targetInvoiceMonth.trim()) {
      throw new Error('O mês da fatura de destino é obrigatório.');
    }
    if (!input.targetDate || !input.targetDate.trim()) {
      throw new Error('A data de vencimento de destino é obrigatória.');
    }
    if (!input.items || input.items.length === 0) {
      throw new Error('Nenhuma parcela selecionada para antecipação.');
    }

    const updatedTransactions: Transaction[] = [];

    for (const item of input.items) {
      const tx = await this.transactionRepository.findById(item.transactionId);
      if (!tx) {
        throw new Error(`Transação ${item.transactionId} não encontrada.`);
      }

      // BUG-03: Não permitir antecipar parcelas que já foram quitadas
      if (tx.isPaid) {
        throw new Error(`A parcela "${tx.description}" já está quitada e não pode ser antecipada.`);
      }

      // BUG-03: Permitir antecipação apenas para despesas no cartão de crédito
      if (tx.paymentMethod !== PaymentMethod.CREDIT_CARD) {
        throw new Error('Apenas compras com cartão de crédito podem ter parcelas antecipadas.');
      }

      // BUG-03: Garantir que apenas despesas sejam antecipadas
      if (tx.type !== TransactionType.EXPENSE) {
        throw new Error('Apenas despesas podem ter parcelas antecipadas.');
      }

      // Validação de integridade do desconto financeiro em centavos
      const discount = item.discountCents ?? 0;
      if (discount < 0) {
        throw new Error('O desconto não pode ser negativo.');
      }
      if (discount >= tx.amountCents) {
        throw new Error('O desconto não pode ser maior ou igual ao valor da parcela.');
      }

      const finalAmountCents = tx.amountCents - discount;

      const updated: Transaction = {
        ...tx,
        date: input.targetDate,
        invoiceMonth: input.targetInvoiceMonth,
        amountCents: finalAmountCents,
        isAnticipated: true,
      };

      await this.transactionRepository.update(updated);
      updatedTransactions.push(updated);
    }

    return updatedTransactions;
  }
}

