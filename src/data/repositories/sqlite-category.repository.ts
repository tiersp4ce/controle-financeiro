import { ICategoryRepository } from '../../domain/repositories/category.repository';
import { Category } from '../../domain/entities/category';
import { getDatabase } from '../database/sqlite-connection';

const WEB_STORAGE_KEY = 'finapp_categories_data';

export class SqliteCategoryRepository implements ICategoryRepository {
  private getWebCategories(): Category[] {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(WEB_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveWebCategories(categories: Category[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(categories));
    }
  }

  async create(category: Category): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const cats = this.getWebCategories();
      cats.push(category);
      this.saveWebCategories(cats);
      return;
    }
    await db.runAsync(
      `INSERT INTO categories (id, name, iconKey, colorHex, isDefault) VALUES (?, ?, ?, ?, ?);`,
      category.id,
      category.name,
      category.iconKey,
      category.colorHex,
      category.isDefault ? 1 : 0
    );
  }

  async createMany(categories: Category[]): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const cats = this.getWebCategories();
      const map = new Map(cats.map((c) => [c.id, c]));
      categories.forEach((c) => map.set(c.id, c));
      this.saveWebCategories(Array.from(map.values()));
      return;
    }
    await db.withTransactionAsync(async () => {
      for (const cat of categories) {
        await db.runAsync(
          `INSERT OR REPLACE INTO categories (id, name, iconKey, colorHex, isDefault) VALUES (?, ?, ?, ?, ?);`,
          cat.id,
          cat.name,
          cat.iconKey,
          cat.colorHex,
          cat.isDefault ? 1 : 0
        );
      }
    });
  }

  async update(category: Category): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const cats = this.getWebCategories().map((c) => (c.id === category.id ? category : c));
      this.saveWebCategories(cats);
      return;
    }
    await db.runAsync(
      `UPDATE categories SET name = ?, iconKey = ?, colorHex = ? WHERE id = ?;`,
      category.name,
      category.iconKey,
      category.colorHex,
      category.id
    );
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      const cats = this.getWebCategories().filter((c) => c.id !== id);
      this.saveWebCategories(cats);
      return;
    }
    await db.runAsync(`DELETE FROM categories WHERE id = ?;`, id);
  }

  async findById(id: string): Promise<Category | null> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebCategories().find((c) => c.id === id) ?? null;
    }
    const row = await db.getFirstAsync<any>(`SELECT * FROM categories WHERE id = ?;`, id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      iconKey: row.iconKey,
      colorHex: row.colorHex,
      isDefault: Boolean(row.isDefault),
    };
  }

  async findAll(): Promise<Category[]> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebCategories().sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    }
    const rows = await db.getAllAsync<any>(`SELECT * FROM categories ORDER BY isDefault DESC, name ASC;`);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      iconKey: row.iconKey,
      colorHex: row.colorHex,
      isDefault: Boolean(row.isDefault),
    }));
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebCategories().length;
    }
    const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM categories;`);
    return row?.count ?? 0;
  }

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      this.saveWebCategories([]);
      return;
    }
    await db.runAsync(`DELETE FROM categories;`);
  }
}
