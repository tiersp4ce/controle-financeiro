import { ITransactionRepository } from '../../repositories/transaction.repository';
import { Transaction } from '../../entities/transaction';

export class GetTransactionsByMonthUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(monthKey: string): Promise<Transaction[]> {
    return this.transactionRepository.findByMonth(monthKey);
  }
}
