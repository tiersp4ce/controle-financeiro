import { ITransactionRepository } from '../../domain/repositories/transaction.repository';
import { Transaction } from '../../domain/entities/transaction';
import { getDatabase } from '../database/sqlite-connection';
import { PaymentMethod } from '../../domain/enums';

const WEB_STORAGE_KEY = 'finapp_transactions_data';

export class SqliteTransactionRepository implements ITransactionRepository {
  private getWebTransactions(): Transaction[] {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(WEB_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveWebTransactions(transactions: Transaction[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(transactions));
    }
  }

  private mapRow(row: any): Transaction {
    return {
      id: row.id,
      description: row.description,
      amountCents: row.amountCents,
      type: row.type,
      date: row.date,
      categoryId: row.categoryId,
      paymentMethod: row.paymentMethod,
      recurrence: row.recurrence,
      installmentGroupId: row.installmentGroupId,
      installmentNumber: row.installmentNumber,
      totalInstallments: row.totalInstallments,
      purchaseDate: row.purchaseDate ?? row.date,
      invoiceMonth: row.invoiceMonth ?? row.date.substring(0, 7),
      isPaid: Boolean(row.isPaid),
      isAnticipated: Boolean(row.isAnticipated),
      recurringTransactionId: row.recurringTransactionId ?? null,
      createdAt: row.createdAt,
    };
  }

  async create(t: Transaction): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const txs = this.getWebTransactions();
      txs.push(t);
      this.saveWebTransactions(txs);
      return;
    }
    await db.runAsync(
      `INSERT INTO transactions (
        id, description, amountCents, type, date, categoryId,
        paymentMethod, recurrence, installmentGroupId, installmentNumber,
        totalInstallments, purchaseDate, invoiceMonth, isPaid, isAnticipated,
        recurringTransactionId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      t.id,
      t.description,
      t.amountCents,
      t.type,
      t.date,
      t.categoryId,
      t.paymentMethod,
      t.recurrence,
      t.installmentGroupId ?? null,
      t.installmentNumber ?? null,
      t.totalInstallments ?? null,
      t.purchaseDate ?? t.date,
      t.invoiceMonth ?? t.date.substring(0, 7),
      t.isPaid ? 1 : 0,
      t.isAnticipated ? 1 : 0,
      t.recurringTransactionId ?? null,
      t.createdAt
    );
  }

  async createMany(transactions: Transaction[]): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const txs = this.getWebTransactions();
      const map = new Map(txs.map((t) => [t.id, t]));
      transactions.forEach((t) => map.set(t.id, t));
      this.saveWebTransactions(Array.from(map.values()));
      return;
    }
    await db.withTransactionAsync(async () => {
      for (const t of transactions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transactions (
            id, description, amountCents, type, date, categoryId,
            paymentMethod, recurrence, installmentGroupId, installmentNumber,
            totalInstallments, purchaseDate, invoiceMonth, isPaid, isAnticipated,
            recurringTransactionId, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          t.id,
          t.description,
          t.amountCents,
          t.type,
          t.date,
          t.categoryId,
          t.paymentMethod,
          t.recurrence,
          t.installmentGroupId ?? null,
          t.installmentNumber ?? null,
          t.totalInstallments ?? null,
          t.purchaseDate ?? t.date,
          t.invoiceMonth ?? t.date.substring(0, 7),
          t.isPaid ? 1 : 0,
          t.isAnticipated ? 1 : 0,
          t.recurringTransactionId ?? null,
          t.createdAt
        );
      }
    });
  }

  async update(t: Transaction): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const txs = this.getWebTransactions().map((item) => (item.id === t.id ? t : item));
      this.saveWebTransactions(txs);
      return;
    }
    await db.runAsync(
      `UPDATE transactions SET
        description = ?, amountCents = ?, type = ?, date = ?,
        categoryId = ?, paymentMethod = ?, recurrence = ?,
        purchaseDate = ?, invoiceMonth = ?, isPaid = ?, isAnticipated = ?,
        recurringTransactionId = ?
      WHERE id = ?;`,
      t.description,
      t.amountCents,
      t.type,
      t.date,
      t.categoryId,
      t.paymentMethod,
      t.recurrence,
      t.purchaseDate ?? t.date,
      t.invoiceMonth ?? t.date.substring(0, 7),
      t.isPaid ? 1 : 0,
      t.isAnticipated ? 1 : 0,
      t.recurringTransactionId ?? null,
      t.id
    );
  }

  async updateMany(transactions: Transaction[]): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      for (const t of transactions) {
        await this.update(t);
      }
      return;
    }

    await db.withTransactionAsync(async () => {
      for (const t of transactions) {
        await db.runAsync(
          `UPDATE transactions SET
            description = ?, amountCents = ?, type = ?, date = ?,
            categoryId = ?, paymentMethod = ?, recurrence = ?,
            purchaseDate = ?, invoiceMonth = ?, isPaid = ?, isAnticipated = ?,
            recurringTransactionId = ?
          WHERE id = ?;`,
          t.description,
          t.amountCents,
          t.type,
          t.date,
          t.categoryId,
          t.paymentMethod,
          t.recurrence,
          t.purchaseDate ?? t.date,
          t.invoiceMonth ?? t.date.substring(0, 7),
          t.isPaid ? 1 : 0,
          t.isAnticipated ? 1 : 0,
          t.recurringTransactionId ?? null,
          t.id
        );
      }
    });
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const txs = this.getWebTransactions().filter((item) => item.id !== id);
      this.saveWebTransactions(txs);
      return;
    }
    await db.runAsync(`DELETE FROM transactions WHERE id = ?;`, id);
  }

  async deleteByInstallmentGroupId(groupId: string): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const txs = this.getWebTransactions().filter((item) => item.installmentGroupId !== groupId);
      this.saveWebTransactions(txs);
      return;
    }
    await db.runAsync(`DELETE FROM transactions WHERE installmentGroupId = ?;`, groupId);
  }

  async deleteByRecurringId(recurringId: string): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const txs = this.getWebTransactions().filter((item) => item.recurringTransactionId !== recurringId);
      this.saveWebTransactions(txs);
      return;
    }
    await db.runAsync(`DELETE FROM transactions WHERE recurringTransactionId = ?;`, recurringId);
  }

  async deleteFutureByRecurringId(recurringId: string, fromMonthKey: string): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const txs = this.getWebTransactions().filter(
        (item) =>
          !(
            item.recurringTransactionId === recurringId &&
            (item.purchaseDate ?? item.date).substring(0, 7) >= fromMonthKey &&
            !item.isPaid
          )
      );
      this.saveWebTransactions(txs);
      return;
    }
    await db.runAsync(
      `DELETE FROM transactions
       WHERE recurringTransactionId = ?
         AND (strftime('%Y-%m', IFNULL(purchaseDate, date)) >= ?)
         AND isPaid = 0;`,
      recurringId,
      fromMonthKey
    );
  }

  async findById(id: string): Promise<Transaction | null> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions().find((t) => t.id === id) ?? null;
    }
    const row = await db.getFirstAsync<any>(`SELECT * FROM transactions WHERE id = ?;`, id);
    if (!row) return null;
    return this.mapRow(row);
  }

  async findByMonth(monthKey: string): Promise<Transaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions()
        .filter((t) => t.date.startsWith(monthKey))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    }
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC, createdAt DESC;`,
      monthKey
    );
    return rows.map(this.mapRow);
  }

  async findByInvoiceMonth(invoiceMonth: string): Promise<Transaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions()
        .filter((t) => (t.invoiceMonth ?? t.date.substring(0, 7)) === invoiceMonth)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    }
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions WHERE invoiceMonth = ? OR (invoiceMonth IS NULL AND strftime('%Y-%m', date) = ?) ORDER BY date DESC, createdAt DESC;`,
      invoiceMonth,
      invoiceMonth
    );
    return rows.map(this.mapRow);
  }

  async findByInstallmentGroupId(groupId: string): Promise<Transaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions()
        .filter((t) => t.installmentGroupId === groupId)
        .sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0) || a.createdAt - b.createdAt);
    }
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions WHERE installmentGroupId = ? ORDER BY installmentNumber ASC, createdAt ASC;`,
      groupId
    );
    return rows.map(this.mapRow);
  }

  async findByRecurringId(recurringId: string): Promise<Transaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions()
        .filter((t) => t.recurringTransactionId === recurringId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    }
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions WHERE recurringTransactionId = ? ORDER BY date ASC, createdAt ASC;`,
      recurringId
    );
    return rows.map(this.mapRow);
  }

  async findUnpaidFutureByRecurringId(
    recurringId: string,
    fromMonthKey: string
  ): Promise<Transaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions().filter(
        (t) =>
          t.recurringTransactionId === recurringId &&
          !t.isPaid &&
          (t.purchaseDate ?? t.date).substring(0, 7) >= fromMonthKey
      );
    }

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions
       WHERE recurringTransactionId = ?
         AND isPaid = 0
         AND (strftime('%Y-%m', IFNULL(purchaseDate, date)) >= ?)
       ORDER BY date ASC;`,
      recurringId,
      fromMonthKey
    );
    return rows.map(this.mapRow);
  }

  async findCreditCardTransactions(): Promise<Transaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions()
        .filter((t) => t.paymentMethod === PaymentMethod.CREDIT_CARD)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    }
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions WHERE paymentMethod = ? ORDER BY date DESC, createdAt DESC;`,
      PaymentMethod.CREDIT_CARD
    );
    return rows.map(this.mapRow);
  }

  async findRecent(limit: number): Promise<Transaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions()
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
        .slice(0, limit);
    }
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions ORDER BY date DESC, createdAt DESC LIMIT ?;`,
      limit
    );
    return rows.map(this.mapRow);
  }

  async findAll(): Promise<Transaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions().sort((a, b) => b.date.localeCompare(a.date));
    }
    const rows = await db.getAllAsync<any>(`SELECT * FROM transactions ORDER BY date DESC;`);
    return rows.map(this.mapRow);
  }

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      this.saveWebTransactions([]);
      return;
    }
    await db.runAsync(`DELETE FROM transactions;`);
  }

  /**
   * Conta a quantidade de transações associadas a uma categoria específica.
   * Suporta tanto banco SQLite nativo (COUNT rápido com índice) quanto Web localStorage.
   */
  async countByCategoryId(categoryId: string): Promise<number> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebTransactions().filter((t) => t.categoryId === categoryId).length;
    }
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM transactions WHERE categoryId = ?;`,
      categoryId
    );
    return result?.count ?? 0;
  }
}
