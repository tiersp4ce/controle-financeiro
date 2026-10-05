import { BackupData } from '../entities/backup';

export interface IBackupRepository {
  exportToFile(data: BackupData): Promise<string>;
  importFromFile(): Promise<BackupData | null>;
}
