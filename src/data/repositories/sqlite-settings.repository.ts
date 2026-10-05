import { ISettingsRepository } from '../../domain/repositories/settings.repository';
import { SalaryConfig } from '../../domain/entities/salary-config';
import { CreditCardConfig } from '../../domain/entities/credit-card-config';
import { getDatabase } from '../database/sqlite-connection';

const WEB_SALARY_KEY = 'finapp_settings_salary_config';
const WEB_CREDIT_CARD_KEY = 'finapp_settings_credit_card_config';
const DB_SALARY_KEY = 'salary_config';
const DB_CREDIT_CARD_KEY = 'credit_card_config';

export class SqliteSettingsRepository implements ISettingsRepository {
  private getWebItem<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  private saveWebItem<T>(key: string, value: T): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  async getSalaryConfig(): Promise<SalaryConfig | null> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebItem<SalaryConfig>(WEB_SALARY_KEY);
    }

    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?;`,
      DB_SALARY_KEY
    );

    if (!row || !row.value) return null;
    try {
      return JSON.parse(row.value) as SalaryConfig;
    } catch {
      return null;
    }
  }

  async saveSalaryConfig(config: SalaryConfig): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      this.saveWebItem(WEB_SALARY_KEY, config);
      return;
    }

    const jsonValue = JSON.stringify(config);
    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      DB_SALARY_KEY,
      jsonValue
    );
  }

  async getCreditCardConfig(): Promise<CreditCardConfig | null> {
    const db = await getDatabase();
    if (!db) {
      return this.getWebItem<CreditCardConfig>(WEB_CREDIT_CARD_KEY);
    }

    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?;`,
      DB_CREDIT_CARD_KEY
    );

    if (!row || !row.value) return null;
    try {
      return JSON.parse(row.value) as CreditCardConfig;
    } catch {
      return null;
    }
  }

  async saveCreditCardConfig(config: CreditCardConfig): Promise<void> {
    const db = await getDatabase();
    if (!db) {
      this.saveWebItem(WEB_CREDIT_CARD_KEY, config);
      return;
    }

    const jsonValue = JSON.stringify(config);
    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      DB_CREDIT_CARD_KEY,
      jsonValue
    );
  }
}
