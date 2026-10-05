import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ISecurityRepository } from '../../domain/repositories/security.repository';

const PIN_HASH_KEY = 'finapp_security_pin_hash';
const PIN_SALT_KEY = 'finapp_security_pin_salt';

export class ExpoSecurityRepository implements ISecurityRepository {
  private async getStorageItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  }

  private async setStorageItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  }

  private async deleteStorageItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }

  private async hashWithSalt(pin: string, salt: string): Promise<string> {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${pin}:${salt}`
    );
  }

  async isPinSet(): Promise<boolean> {
    const hash = await this.getStorageItem(PIN_HASH_KEY);
    return Boolean(hash);
  }

  async savePin(pin: string): Promise<void> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const salt = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const hash = await this.hashWithSalt(pin, salt);

    await this.setStorageItem(PIN_SALT_KEY, salt);
    await this.setStorageItem(PIN_HASH_KEY, hash);
  }

  async verifyPin(pin: string): Promise<boolean> {
    const storedHash = await this.getStorageItem(PIN_HASH_KEY);
    const storedSalt = await this.getStorageItem(PIN_SALT_KEY);

    if (!storedHash || !storedSalt) return false;

    const computedHash = await this.hashWithSalt(pin, storedSalt);
    return computedHash === storedHash;
  }

  async disablePin(): Promise<void> {
    await this.deleteStorageItem(PIN_HASH_KEY);
    await this.deleteStorageItem(PIN_SALT_KEY);
  }
}
