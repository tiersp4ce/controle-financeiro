import { RecurringTransaction } from '../entities/recurring-transaction';

export interface IRecurringTransactionRepository {
  create(recurring: RecurringTransaction): Promise<void>;
  createMany(recurrings: RecurringTransaction[]): Promise<void>;
  update(recurring: RecurringTransaction): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<RecurringTransaction | null>;
  findAll(): Promise<RecurringTransaction[]>;
  findActive(): Promise<RecurringTransaction[]>;
  findByCategoryId(categoryId: string): Promise<RecurringTransaction[]>;
  countByCategoryId(categoryId: string): Promise<number>;
  deleteAll(): Promise<void>;
}
