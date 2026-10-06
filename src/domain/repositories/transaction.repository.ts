import { Transaction } from '../entities/transaction';

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<void>;
  createMany(transactions: Transaction[]): Promise<void>;
  update(transaction: Transaction): Promise<void>;
  updateMany(transactions: Transaction[]): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByInstallmentGroupId(groupId: string): Promise<void>;
  deleteByRecurringId(recurringId: string): Promise<void>;
  deleteFutureByRecurringId(recurringId: string, fromMonthKey: string): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByMonth(monthKey: string): Promise<Transaction[]>;
  findByInvoiceMonth(invoiceMonth: string): Promise<Transaction[]>;
  findByInstallmentGroupId(groupId: string): Promise<Transaction[]>;
  findByRecurringId(recurringId: string): Promise<Transaction[]>;
  findUnpaidFutureByRecurringId(recurringId: string, fromMonthKey: string): Promise<Transaction[]>;
  findCreditCardTransactions(): Promise<Transaction[]>;
  findRecent(limit: number): Promise<Transaction[]>;
  findAll(): Promise<Transaction[]>;
  deleteAll(): Promise<void>;
  /**
   * Retorna a contagem de transações vinculadas a uma determinada categoria.
   * Utilizado para garantir integridade referencial antes da exclusão de categorias.
   */
  countByCategoryId(categoryId: string): Promise<number>;
}
