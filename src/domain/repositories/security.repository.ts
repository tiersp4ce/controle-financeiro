export interface ISecurityRepository {
  isPinSet(): Promise<boolean>;
  savePin(pin: string): Promise<void>;
  verifyPin(pin: string): Promise<boolean>;
  disablePin(): Promise<void>;
}
