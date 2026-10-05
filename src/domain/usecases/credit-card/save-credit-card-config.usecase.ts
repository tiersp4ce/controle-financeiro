import { ISettingsRepository } from '../../repositories/settings.repository';
import { CreditCardConfig } from '../../entities/credit-card-config';

export interface SaveCreditCardConfigInput {
  cardName: string;
  closingDay: number;
  dueDay: number;
  limitCents?: number | null;
  isEnabled: boolean;
}

export class SaveCreditCardConfigUseCase {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async execute(input: SaveCreditCardConfigInput): Promise<CreditCardConfig> {
    if (!Number.isInteger(input.closingDay) || input.closingDay < 1 || input.closingDay > 31) {
      throw new Error('O dia de fechamento deve ser um número inteiro entre 1 e 31.');
    }

    if (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > 31) {
      throw new Error('O dia de vencimento deve ser um número inteiro entre 1 e 31.');
    }

    const config: CreditCardConfig = {
      cardName: input.cardName.trim() || 'Cartão de Crédito',
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      limitCents: input.limitCents && input.limitCents > 0 ? Math.floor(input.limitCents) : 0,
      isEnabled: input.isEnabled,
      updatedAt: Date.now(),
    };

    await this.settingsRepository.saveCreditCardConfig(config);
    return config;
  }
}
