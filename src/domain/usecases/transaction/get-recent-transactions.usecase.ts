import { ITransactionRepository } from '../../repositories/transaction.repository';
import { Transaction } from '../../entities/transaction';

export class GetRecentTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(limit: number = 10): Promise<Transaction[]> {
    return this.transactionRepository.findRecent(limit);
  }
}
