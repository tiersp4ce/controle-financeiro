import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { InvoicesOverview } from '../../entities/credit-card-invoice';
import { GetCreditCardInvoiceUseCase } from './get-credit-card-invoice.usecase';
import { toMonthKey, shiftMonthKey } from '../../../core/utils/date';

export class GetCreditCardInvoicesOverviewUseCase {
  private readonly getInvoiceUseCase: GetCreditCardInvoiceUseCase;

  constructor(
    transactionRepository: ITransactionRepository,
    settingsRepository: ISettingsRepository
  ) {
    this.getInvoiceUseCase = new GetCreditCardInvoiceUseCase(transactionRepository, settingsRepository);
  }

  async execute(currentMonth?: string, futureLookaheadMonths: number = 6): Promise<InvoicesOverview> {
    const currentMonthKey = currentMonth ?? toMonthKey(new Date());
    const lastMonthKey = shiftMonthKey(currentMonthKey, -1);

    const [currentOpenInvoice, lastClosedInvoice] = await Promise.all([
      this.getInvoiceUseCase.execute(currentMonthKey),
      this.getInvoiceUseCase.execute(lastMonthKey),
    ]);

    const futureInvoices = [];
    let totalFutureCommittedCents = 0;

    for (let i = 1; i <= futureLookaheadMonths; i++) {
      const fMonthKey = shiftMonthKey(currentMonthKey, i);
      const inv = await this.getInvoiceUseCase.execute(fMonthKey);
      if (inv.transactionsCount > 0) {
        futureInvoices.push(inv);
        totalFutureCommittedCents += inv.totalAmountCents;
      }
    }

    return {
      currentOpenInvoice,
      lastClosedInvoice: lastClosedInvoice.transactionsCount > 0 ? lastClosedInvoice : null,
      futureInvoices,
      totalFutureCommittedCents,
    };
  }
}
