import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') {
    return null; // Ambiente Web usa fallback em memória/localStorage
  }
  if (!databaseInstance) {
    databaseInstance = await SQLite.openDatabaseAsync('finance_app.db');
    await initDatabase(databaseInstance);
  }
  return databaseInstance;
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        iconKey TEXT NOT NULL,
        colorHex TEXT NOT NULL,
        isDefault INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        description TEXT NOT NULL,
        amountCents INTEGER NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        recurrence TEXT NOT NULL,
        installmentGroupId TEXT,
        installmentNumber INTEGER,
        totalInstallments INTEGER,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }

  if (currentVersion < 2) {
    const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions);');
    const cols = new Set(tableInfo.map((c) => c.name));
    if (!cols.has('purchaseDate')) await db.execAsync('ALTER TABLE transactions ADD COLUMN purchaseDate TEXT;');
    if (!cols.has('invoiceMonth')) await db.execAsync('ALTER TABLE transactions ADD COLUMN invoiceMonth TEXT;');
    if (!cols.has('isPaid')) await db.execAsync('ALTER TABLE transactions ADD COLUMN isPaid INTEGER NOT NULL DEFAULT 0;');
    if (!cols.has('isAnticipated')) await db.execAsync('ALTER TABLE transactions ADD COLUMN isAnticipated INTEGER NOT NULL DEFAULT 0;');
  }

  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        description TEXT NOT NULL,
        amountCents INTEGER NOT NULL,
        type TEXT NOT NULL,
        dayOfMonth INTEGER NOT NULL,
        categoryId TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT,
        skippedMonths TEXT NOT NULL DEFAULT '[]',
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions);');
    const cols = new Set(tableInfo.map((c) => c.name));
    if (!cols.has('recurringTransactionId')) {
      await db.execAsync('ALTER TABLE transactions ADD COLUMN recurringTransactionId TEXT;');
    }

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
      CREATE INDEX IF NOT EXISTS idx_transactions_installmentGroupId ON transactions(installmentGroupId);
      CREATE INDEX IF NOT EXISTS idx_transactions_invoiceMonth ON transactions(invoiceMonth);
      CREATE INDEX IF NOT EXISTS idx_transactions_paymentMethod ON transactions(paymentMethod);
      CREATE INDEX IF NOT EXISTS idx_transactions_recurringId ON transactions(recurringTransactionId);
      CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(isActive);
      CREATE INDEX IF NOT EXISTS idx_recurring_categoryId ON recurring_transactions(categoryId);
      PRAGMA user_version = 3;
    `);
  }

  if (currentVersion < 4) {
    const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions);');
    const cols = new Set(tableInfo.map((c) => c.name));
    if (!cols.has('paidAt')) {
      await db.execAsync('ALTER TABLE transactions ADD COLUMN paidAt TEXT;');
    }
    if (!cols.has('notes')) {
      await db.execAsync('ALTER TABLE transactions ADD COLUMN notes TEXT;');
    }
    await db.execAsync('PRAGMA user_version = 4;');
  }
}

