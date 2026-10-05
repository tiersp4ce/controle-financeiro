import { IRecurringTransactionRepository } from '../../repositories/recurring-transaction.repository';
import { RecurringTransaction } from '../../entities/recurring-transaction';

export class GetRecurringTransactionsUseCase {
  constructor(private readonly recurringRepo: IRecurringTransactionRepository) {}

  async execute(): Promise<RecurringTransaction[]> {
    return this.recurringRepo.findAll();
  }

  async executeActive(): Promise<RecurringTransaction[]> {
    return this.recurringRepo.findActive();
  }
}
