import { SqliteTransactionRepository } from '../../data/repositories/sqlite-transaction.repository';
import { SqliteCategoryRepository } from '../../data/repositories/sqlite-category.repository';
import { SqliteSettingsRepository } from '../../data/repositories/sqlite-settings.repository';
import { SqliteRecurringTransactionRepository } from '../../data/repositories/sqlite-recurring-transaction.repository';
import { ExpoSecurityRepository } from '../../data/repositories/expo-security.repository';
import { ExpoBackupRepository } from '../../data/repositories/expo-backup.repository';
import { SqliteTransactionRunner } from '../../data/database/sqlite-transaction-runner';

import { CreateTransactionUseCase } from '../../domain/usecases/transaction/create-transaction.usecase';
import { CreateInstallmentTransactionUseCase } from '../../domain/usecases/transaction/create-installment-transaction.usecase';
import { UpdateTransactionUseCase } from '../../domain/usecases/transaction/update-transaction.usecase';
import { DeleteTransactionUseCase } from '../../domain/usecases/transaction/delete-transaction.usecase';
import { GetTransactionsByMonthUseCase } from '../../domain/usecases/transaction/get-transactions-by-month.usecase';
import { GetRecentTransactionsUseCase } from '../../domain/usecases/transaction/get-recent-transactions.usecase';
import { GetConsolidatedRecentFeedUseCase } from '../../domain/usecases/transaction/get-consolidated-recent-feed.usecase';
import { ToggleTransactionPaidUseCase } from '../../domain/usecases/transaction/toggle-transaction-paid.usecase';

import { EnsureRecurringTransactionsUseCase } from '../../domain/usecases/recurring/ensure-recurring-transactions.usecase';
import { CreateRecurringTransactionUseCase } from '../../domain/usecases/recurring/create-recurring-transaction.usecase';
import { GetRecurringTransactionsUseCase } from '../../domain/usecases/recurring/get-recurring-transactions.usecase';
import { UpdateRecurringTransactionUseCase } from '../../domain/usecases/recurring/update-recurring-transaction.usecase';
import { DeleteRecurringTransactionUseCase } from '../../domain/usecases/recurring/delete-recurring-transaction.usecase';

import { GetMonthlySummaryUseCase } from '../../domain/usecases/finance/get-monthly-summary.usecase';
import { GetFutureCommitmentThermometerUseCase } from '../../domain/usecases/finance/get-future-commitment-thermometer.usecase';
import { GetSavingsAverageUseCase } from '../../domain/usecases/finance/get-savings-average.usecase';

import { GetSalaryConfigUseCase } from '../../domain/usecases/salary/get-salary-config.usecase';
import { SaveSalaryConfigUseCase } from '../../domain/usecases/salary/save-salary-config.usecase';

import { GetCreditCardConfigUseCase } from '../../domain/usecases/credit-card/get-credit-card-config.usecase';
import { SaveCreditCardConfigUseCase } from '../../domain/usecases/credit-card/save-credit-card-config.usecase';
import { GetCreditCardInvoiceUseCase } from '../../domain/usecases/credit-card/get-credit-card-invoice.usecase';
import { GetCreditCardInvoicesOverviewUseCase } from '../../domain/usecases/credit-card/get-credit-card-invoices-overview.usecase';
import { PayCreditCardInvoiceUseCase } from '../../domain/usecases/credit-card/pay-credit-card-invoice.usecase';
import { AdvanceInstallmentsUseCase } from '../../domain/usecases/credit-card/advance-installments.usecase';

import {
  GetCategoriesUseCase,
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  SeedDefaultCategoriesUseCase,
} from '../../domain/usecases/category/category-usecases';

import {
  IsPinSetUseCase,
  SetPinUseCase,
  VerifyPinUseCase,
  DisablePinUseCase,
} from '../../domain/usecases/security/security-usecases';

import {
  ExportBackupJsonUseCase,
  ImportBackupJsonUseCase,
} from '../../domain/usecases/backup/backup-usecases';

export interface AppContainer {
  transactionRepo: SqliteTransactionRepository;
  categoryRepo: SqliteCategoryRepository;
  settingsRepo: SqliteSettingsRepository;
  recurringRepo: SqliteRecurringTransactionRepository;
  securityRepo: ExpoSecurityRepository;
  backupRepo: ExpoBackupRepository;

  createTransaction: CreateTransactionUseCase;
  createInstallmentTransaction: CreateInstallmentTransactionUseCase;
  updateTransaction: UpdateTransactionUseCase;
  deleteTransaction: DeleteTransactionUseCase;
  getTransactionsByMonth: GetTransactionsByMonthUseCase;
  getRecentTransactions: GetRecentTransactionsUseCase;
  getConsolidatedRecentFeed: GetConsolidatedRecentFeedUseCase;
  toggleTransactionPaid: ToggleTransactionPaidUseCase;

  ensureRecurringTransactions: EnsureRecurringTransactionsUseCase;
  createRecurringTransaction: CreateRecurringTransactionUseCase;
  getRecurringTransactions: GetRecurringTransactionsUseCase;
  updateRecurringTransaction: UpdateRecurringTransactionUseCase;
  deleteRecurringTransaction: DeleteRecurringTransactionUseCase;

  getMonthlySummary: GetMonthlySummaryUseCase;
  getThermometer: GetFutureCommitmentThermometerUseCase;
  getSavingsAverage: GetSavingsAverageUseCase;

  getSalaryConfig: GetSalaryConfigUseCase;
  saveSalaryConfig: SaveSalaryConfigUseCase;

  getCreditCardConfig: GetCreditCardConfigUseCase;
  saveCreditCardConfig: SaveCreditCardConfigUseCase;
  getCreditCardInvoice: GetCreditCardInvoiceUseCase;
  getCreditCardInvoicesOverview: GetCreditCardInvoicesOverviewUseCase;
  payCreditCardInvoice: PayCreditCardInvoiceUseCase;
  advanceInstallments: AdvanceInstallmentsUseCase;

  getCategories: GetCategoriesUseCase;
  createCategory: CreateCategoryUseCase;
  updateCategory: UpdateCategoryUseCase;
  deleteCategory: DeleteCategoryUseCase;
  seedDefaultCategories: SeedDefaultCategoriesUseCase;

  isPinSet: IsPinSetUseCase;
  setPin: SetPinUseCase;
  verifyPin: VerifyPinUseCase;
  disablePin: DisablePinUseCase;

  exportBackup: ExportBackupJsonUseCase;
  importBackup: ImportBackupJsonUseCase;
}

export function createContainer(): AppContainer {
  const transactionRepo = new SqliteTransactionRepository();
  const categoryRepo = new SqliteCategoryRepository();
  const settingsRepo = new SqliteSettingsRepository();
  const recurringRepo = new SqliteRecurringTransactionRepository();
  const securityRepo = new ExpoSecurityRepository();
  const backupRepo = new ExpoBackupRepository();
  const transactionRunner = new SqliteTransactionRunner();

  const ensureRecurringTransactions = new EnsureRecurringTransactionsUseCase(
    recurringRepo,
    transactionRepo,
    settingsRepo
  );

  return {
    transactionRepo,
    categoryRepo,
    settingsRepo,
    recurringRepo,
    securityRepo,
    backupRepo,

    createTransaction: new CreateTransactionUseCase(transactionRepo, settingsRepo, recurringRepo),
    createInstallmentTransaction: new CreateInstallmentTransactionUseCase(transactionRepo, settingsRepo),
    updateTransaction: new UpdateTransactionUseCase(transactionRepo),
    deleteTransaction: new DeleteTransactionUseCase(transactionRepo),
    getTransactionsByMonth: new GetTransactionsByMonthUseCase(transactionRepo),
    getRecentTransactions: new GetRecentTransactionsUseCase(transactionRepo),
    getConsolidatedRecentFeed: new GetConsolidatedRecentFeedUseCase(transactionRepo),
    toggleTransactionPaid: new ToggleTransactionPaidUseCase(transactionRepo),

    ensureRecurringTransactions,
    createRecurringTransaction: new CreateRecurringTransactionUseCase(recurringRepo, ensureRecurringTransactions),
    getRecurringTransactions: new GetRecurringTransactionsUseCase(recurringRepo),
    updateRecurringTransaction: new UpdateRecurringTransactionUseCase(recurringRepo, transactionRepo, settingsRepo),
    deleteRecurringTransaction: new DeleteRecurringTransactionUseCase(recurringRepo, transactionRepo),

    getMonthlySummary: new GetMonthlySummaryUseCase(transactionRepo, categoryRepo, settingsRepo),
    getThermometer: new GetFutureCommitmentThermometerUseCase(transactionRepo, settingsRepo),
    getSavingsAverage: new GetSavingsAverageUseCase(transactionRepo, settingsRepo),

    getSalaryConfig: new GetSalaryConfigUseCase(settingsRepo),
    saveSalaryConfig: new SaveSalaryConfigUseCase(settingsRepo),

    getCreditCardConfig: new GetCreditCardConfigUseCase(settingsRepo),
    saveCreditCardConfig: new SaveCreditCardConfigUseCase(settingsRepo),
    getCreditCardInvoice: new GetCreditCardInvoiceUseCase(transactionRepo, settingsRepo),
    getCreditCardInvoicesOverview: new GetCreditCardInvoicesOverviewUseCase(transactionRepo, settingsRepo),
    payCreditCardInvoice: new PayCreditCardInvoiceUseCase(transactionRepo),
    advanceInstallments: new AdvanceInstallmentsUseCase(transactionRepo),

    getCategories: new GetCategoriesUseCase(categoryRepo),
    createCategory: new CreateCategoryUseCase(categoryRepo),
    updateCategory: new UpdateCategoryUseCase(categoryRepo),
    deleteCategory: new DeleteCategoryUseCase(categoryRepo, recurringRepo, transactionRepo),
    seedDefaultCategories: new SeedDefaultCategoriesUseCase(categoryRepo),

    isPinSet: new IsPinSetUseCase(securityRepo),
    setPin: new SetPinUseCase(securityRepo),
    verifyPin: new VerifyPinUseCase(securityRepo),
    disablePin: new DisablePinUseCase(securityRepo),

    exportBackup: new ExportBackupJsonUseCase(transactionRepo, categoryRepo, backupRepo, settingsRepo, recurringRepo),
    importBackup: new ImportBackupJsonUseCase(
      transactionRepo,
      categoryRepo,
      backupRepo,
      settingsRepo,
      recurringRepo,
      transactionRunner
    ),
  };
}
