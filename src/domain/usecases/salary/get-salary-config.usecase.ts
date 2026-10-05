import { ISettingsRepository } from '../../repositories/settings.repository';
import { SalaryConfig } from '../../entities/salary-config';

export class GetSalaryConfigUseCase {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async execute(): Promise<SalaryConfig | null> {
    return this.settingsRepository.getSalaryConfig();
  }
}
