import { Category } from './category';
import { Transaction } from './transaction';
import { SalaryConfig } from './salary-config';
import { CreditCardConfig } from './credit-card-config';
import { RecurringTransaction } from './recurring-transaction';

export interface BackupData {
  version: number; // v4
  exportedAt: string;
  categories: Category[];
  transactions: Transaction[];
  salaryConfig?: SalaryConfig | null;
  creditCardConfig?: CreditCardConfig | null;
  recurringTransactions?: RecurringTransaction[];
}
