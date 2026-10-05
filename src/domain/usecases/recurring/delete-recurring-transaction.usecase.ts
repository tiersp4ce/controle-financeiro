import { IRecurringTransactionRepository } from '../../repositories/recurring-transaction.repository';
import { ITransactionRepository } from '../../repositories/transaction.repository';

export class DeleteRecurringTransactionUseCase {
  constructor(
    private readonly recurringRepo: IRecurringTransactionRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async skipMonth(
    recurringId: string,
    monthKey: string,
    deleteExistingOccurrence = true
  ): Promise<void> {
    const rule = await this.recurringRepo.findById(recurringId);
    if (!rule) return;

    const skipped = new Set(rule.skippedMonths ?? []);
    skipped.add(monthKey);

    await this.recurringRepo.update({
      ...rule,
      skippedMonths: Array.from(skipped),
    });

    if (deleteExistingOccurrence) {
      const txs = await this.transactionRepo.findByRecurringId(recurringId);
      const target = txs.find((t) => (t.purchaseDate ?? t.date).startsWith(monthKey));
      if (target) {
        await this.transactionRepo.delete(target.id);
      }
    }
  }

  async endRecurrence(
    recurringId: string,
    endMonthKey: string,
    deleteFutureOccurrences = true
  ): Promise<void> {
    const rule = await this.recurringRepo.findById(recurringId);
    if (!rule) return;

    await this.recurringRepo.update({
      ...rule,
      endDate: `${endMonthKey}-01`,
      isActive: false,
    });

    if (deleteFutureOccurrences) {
      await this.transactionRepo.deleteFutureByRecurringId(recurringId, endMonthKey);
    }
  }

  async deleteAll(recurringId: string): Promise<void> {
    await this.transactionRepo.deleteByRecurringId(recurringId);
    await this.recurringRepo.delete(recurringId);
  }
}
