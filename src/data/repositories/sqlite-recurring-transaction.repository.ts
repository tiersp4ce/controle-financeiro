import { IRecurringTransactionRepository } from '../../domain/repositories/recurring-transaction.repository';
import { RecurringTransaction } from '../../domain/entities/recurring-transaction';
import { getDatabase } from '../database/sqlite-connection';

const WEB_RECURRING_KEY = 'finapp_recurring_transactions_data';

export class SqliteRecurringTransactionRepository implements IRecurringTransactionRepository {
  private getWebItems(): RecurringTransaction[] {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(WEB_RECURRING_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveWebItems(items: RecurringTransaction[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_RECURRING_KEY, JSON.stringify(items));
    }
  }

  private mapRow(row: any): RecurringTransaction {
    let skipped: string[] = [];
    try {
      skipped = row.skippedMonths ? JSON.parse(row.skippedMonths) : [];
    } catch {
      skipped = [];
    }

    return {
      id: row.id,
      description: row.description,
      amountCents: row.amountCents,
      type: row.type,
      dayOfMonth: row.dayOfMonth,
      categoryId: row.categoryId,
      paymentMethod: row.paymentMethod,
      startDate: row.startDate,
      endDate: row.endDate ?? null,
      skippedMonths: skipped,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
    };
  }

  async create(r: RecurringTransaction): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const list = this.getWebItems();
      list.push(r);
      this.saveWebItems(list);
      return;
    }

    await db.runAsync(
      `INSERT INTO recurring_transactions (
        id, description, amountCents, type, dayOfMonth,
        categoryId, paymentMethod, startDate, endDate,
        skippedMonths, isActive, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      r.id,
      r.description,
      r.amountCents,
      r.type,
      r.dayOfMonth,
      r.categoryId,
      r.paymentMethod,
      r.startDate,
      r.endDate ?? null,
      JSON.stringify(r.skippedMonths ?? []),
      r.isActive ? 1 : 0,
      r.createdAt
    );
  }

  async createMany(items: RecurringTransaction[]): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const current = this.getWebItems();
      const map = new Map(current.map((i) => [i.id, i]));
      items.forEach((i) => map.set(i.id, i));
      this.saveWebItems(Array.from(map.values()));
      return;
    }

    await db.withTransactionAsync(async () => {
      for (const r of items) {
        await db.runAsync(
          `INSERT OR REPLACE INTO recurring_transactions (
            id, description, amountCents, type, dayOfMonth,
            categoryId, paymentMethod, startDate, endDate,
            skippedMonths, isActive, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          r.id,
          r.description,
          r.amountCents,
          r.type,
          r.dayOfMonth,
          r.categoryId,
          r.paymentMethod,
          r.startDate,
          r.endDate ?? null,
          JSON.stringify(r.skippedMonths ?? []),
          r.isActive ? 1 : 0,
          r.createdAt
        );
      }
    });
  }

  async update(r: RecurringTransaction): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const list = this.getWebItems().map((item) => (item.id === r.id ? r : item));
      this.saveWebItems(list);
      return;
    }

    await db.runAsync(
      `UPDATE recurring_transactions SET
        description = ?, amountCents = ?, type = ?, dayOfMonth = ?,
        categoryId = ?, paymentMethod = ?, startDate = ?, endDate = ?,
        skippedMonths = ?, isActive = ?
      WHERE id = ?;`,
      r.description,
      r.amountCents,
      r.type,
      r.dayOfMonth,
      r.categoryId,
      r.paymentMethod,
      r.startDate,
      r.endDate ?? null,
      JSON.stringify(r.skippedMonths ?? []),
      r.isActive ? 1 : 0,
      r.id
    );
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const list = this.getWebItems().filter((item) => item.id !== id);
      this.saveWebItems(list);
      return;
    }

    await db.runAsync(`DELETE FROM recurring_transactions WHERE id = ?;`, id);
  }

  async findById(id: string): Promise<RecurringTransaction | null> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebItems().find((i) => i.id === id) ?? null;
    }

    const row = await db.getFirstAsync<any>(
      `SELECT * FROM recurring_transactions WHERE id = ?;`,
      id
    );
    return row ? this.mapRow(row) : null;
  }

  async findAll(): Promise<RecurringTransaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebItems().sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    }

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM recurring_transactions ORDER BY dayOfMonth ASC, createdAt DESC;`
    );
    return rows.map(this.mapRow);
  }

  async findActive(): Promise<RecurringTransaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebItems()
        .filter((i) => i.isActive)
        .sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    }

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM recurring_transactions WHERE isActive = 1 ORDER BY dayOfMonth ASC, createdAt DESC;`
    );
    return rows.map(this.mapRow);
  }

  async findByCategoryId(categoryId: string): Promise<RecurringTransaction[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebItems().filter((i) => i.categoryId === categoryId);
    }

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM recurring_transactions WHERE categoryId = ?;`,
      categoryId
    );
    return rows.map(this.mapRow);
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebItems().filter((i) => i.categoryId === categoryId && i.isActive).length;
    }

    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM recurring_transactions WHERE categoryId = ? AND isActive = 1;`,
      categoryId
    );
    return row?.count ?? 0;
  }

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      this.saveWebItems([]);
      return;
    }

    await db.runAsync(`DELETE FROM recurring_transactions;`);
  }
}
