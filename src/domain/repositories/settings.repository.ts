import { SalaryConfig } from '../entities/salary-config';
import { CreditCardConfig } from '../entities/credit-card-config';

export interface ISettingsRepository {
  getSalaryConfig(): Promise<SalaryConfig | null>;
  saveSalaryConfig(config: SalaryConfig): Promise<void>;
  getCreditCardConfig(): Promise<CreditCardConfig | null>;
  saveCreditCardConfig(config: CreditCardConfig): Promise<void>;
}
