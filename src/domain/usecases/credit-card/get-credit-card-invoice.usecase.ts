import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { CreditCardInvoiceSummary, InvoiceStatus } from '../../entities/credit-card-invoice';
import { DEFAULT_CREDIT_CARD_CONFIG } from '../../entities/credit-card-config';
import { getInvoiceDatesForMonth } from '../../../core/utils/credit-card-cycle';
import { toIsoDateString, toMonthKey } from '../../../core/utils/date';
import { PaymentMethod, TransactionType } from '../../enums';

export class GetCreditCardInvoiceUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly settingsRepository: ISettingsRepository
  ) {}

  async execute(invoiceMonthKey: string): Promise<CreditCardInvoiceSummary> {
    const config = (await this.settingsRepository.getCreditCardConfig()) ?? DEFAULT_CREDIT_CARD_CONFIG;
    const { closingDate, dueDate } = getInvoiceDatesForMonth(
      invoiceMonthKey,
      config.closingDay,
      config.dueDay
    );

    // Busca todas as transações de cartão deste invoiceMonth
    const allTxs = await this.transactionRepository.findByInvoiceMonth(invoiceMonthKey);
    const cardExpenses = allTxs.filter(
      (tx) => tx.type === TransactionType.EXPENSE && tx.paymentMethod === PaymentMethod.CREDIT_CARD
    );

    const totalAmountCents = cardExpenses.reduce((acc, curr) => acc + curr.amountCents, 0);
    const allPaid = cardExpenses.length > 0 && cardExpenses.every((tx) => tx.isPaid);
    const paidAmountCents = cardExpenses
      .filter((tx) => tx.isPaid)
      .reduce((acc, curr) => acc + curr.amountCents, 0);

    const todayIso = toIsoDateString(new Date());
    const currentMonthKey = toMonthKey(new Date());

    let status: InvoiceStatus = 'OPEN';
    let paidAt: string | null = null;

    if (allPaid && totalAmountCents > 0) {
      status = 'PAID';
      // Busca a data/hora mais recente de quitação entre as despesas da fatura
      const paidDates = cardExpenses
        .map((tx) => tx.paidAt)
        .filter((d): d is string => Boolean(d))
        .sort();
      paidAt = paidDates.length > 0 ? paidDates[paidDates.length - 1] : new Date().toISOString();
    } else if (invoiceMonthKey > currentMonthKey) {
      status = 'FUTURE';
    } else if (todayIso >= closingDate) {
      status = 'CLOSED';
    } else {
      status = 'OPEN';
    }

    return {
      invoiceMonth: invoiceMonthKey,
      closingDate,
      dueDate,
      status,
      totalAmountCents,
      paidAmountCents,
      remainingAmountCents: Math.max(0, totalAmountCents - paidAmountCents),
      transactionsCount: cardExpenses.length,
      transactions: cardExpenses,
      paidAt,
    };
  }
}
