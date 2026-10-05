import { ISecurityRepository } from '../../repositories/security.repository';

export class IsPinSetUseCase {
  constructor(private readonly securityRepository: ISecurityRepository) {}
  async execute(): Promise<boolean> {
    return this.securityRepository.isPinSet();
  }
}

export class SetPinUseCase {
  constructor(private readonly securityRepository: ISecurityRepository) {}
  async execute(pin: string): Promise<void> {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('O PIN deve conter exatamente 4 dígitos numéricos.');
    }
    await this.securityRepository.savePin(pin);
  }
}

export class VerifyPinUseCase {
  constructor(private readonly securityRepository: ISecurityRepository) {}
  async execute(pin: string): Promise<boolean> {
    return this.securityRepository.verifyPin(pin);
  }
}

export class DisablePinUseCase {
  constructor(private readonly securityRepository: ISecurityRepository) {}
  async execute(): Promise<void> {
    await this.securityRepository.disablePin();
  }
}
