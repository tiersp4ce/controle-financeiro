import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { IBackupRepository } from '../../domain/repositories/backup.repository';
import { BackupData } from '../../domain/entities/backup';

export class ExpoBackupRepository implements IBackupRepository {
  async exportToFile(data: BackupData): Promise<string> {
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `finapp_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    if (Platform.OS === 'web') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return fileName;
    }

    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar Backup Financeiro',
        UTI: 'public.json',
      });
    }

    return fileUri;
  }

  async importFromFile(): Promise<BackupData | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    let content = '';

    if (Platform.OS === 'web' && file.file) {
      content = await file.file.text();
    } else if (file.uri) {
      content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    if (!content) return null;
    return JSON.parse(content) as BackupData;
  }
}
