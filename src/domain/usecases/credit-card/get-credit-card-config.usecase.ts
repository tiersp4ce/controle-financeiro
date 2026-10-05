import { ISettingsRepository } from '../../repositories/settings.repository';
import { CreditCardConfig } from '../../entities/credit-card-config';

export class GetCreditCardConfigUseCase {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async execute(): Promise<CreditCardConfig | null> {
    return this.settingsRepository.getCreditCardConfig();
  }
}
