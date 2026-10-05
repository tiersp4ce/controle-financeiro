import { ISettingsRepository } from '../../repositories/settings.repository';
import { SalaryConfig } from '../../entities/salary-config';

export interface SaveSalaryConfigInput {
  amountCents: number;
  paymentDay: number;
  isEnabled: boolean;
}

export class SaveSalaryConfigUseCase {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async execute(input: SaveSalaryConfigInput): Promise<SalaryConfig> {
    if (input.amountCents < 0 || !Number.isInteger(input.amountCents)) {
      throw new Error('O valor do salário em centavos deve ser um número inteiro maior ou igual a zero.');
    }

    if (!Number.isInteger(input.paymentDay) || input.paymentDay < 1 || input.paymentDay > 31) {
      throw new Error('O dia de pagamento deve ser um número inteiro entre 1 e 31.');
    }

    const config: SalaryConfig = {
      amountCents: input.amountCents,
      paymentDay: input.paymentDay,
      isEnabled: input.isEnabled,
      updatedAt: Date.now(),
    };

    await this.settingsRepository.saveSalaryConfig(config);
    return config;
  }
}
