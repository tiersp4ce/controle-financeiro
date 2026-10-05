import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CreditCardConfig } from '../../domain/entities/credit-card-config';

interface CreditCardConfigModalProps {
  visible: boolean;
  currentConfig: CreditCardConfig | null;
  onSave: (
    cardName: string,
    closingDay: number,
    dueDay: number,
    limitCents: number,
    isEnabled: boolean
  ) => Promise<void>;
  onClose: () => void;
}

export const CreditCardConfigModal: React.FC<CreditCardConfigModalProps> = ({
  visible,
  currentConfig,
  onSave,
  onClose,
}) => {
  const [cardName, setCardName] = useState('Cartão de Crédito');
  const [closingDay, setClosingDay] = useState('10');
  const [dueDay, setDueDay] = useState('20');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (currentConfig) {
        setCardName(currentConfig.cardName);
        setClosingDay(String(currentConfig.closingDay));
        setDueDay(String(currentConfig.dueDay));
        setIsEnabled(currentConfig.isEnabled);
      } else {
        setCardName('Cartão de Crédito');
        setClosingDay('10');
        setDueDay('20');
        setIsEnabled(true);
      }
      setErrorMessage(null);
    }
  }, [visible, currentConfig]);

  const handleSave = async () => {
    setErrorMessage(null);
    const cDay = parseInt(closingDay, 10);
    const dDay = parseInt(dueDay, 10);

    if (isNaN(cDay) || cDay < 1 || cDay > 31) {
      setErrorMessage('O dia de fechamento deve ser entre 1 e 31.');
      return;
    }
    if (isNaN(dDay) || dDay < 1 || dDay > 31) {
      setErrorMessage('O dia de vencimento deve ser entre 1 e 31.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(cardName, cDay, dDay, 0, isEnabled);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Configurar Cartão de Crédito</Text>
          <Text style={styles.subtitle}>
            Defina o dia que a fatura fecha e vence para calcular o "melhor dia de compra" automaticamente.
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Cartão Ativo</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              thumbColor={isEnabled ? '#03DAC6' : '#666'}
              trackColor={{ false: '#333', true: '#03DAC644' }}
            />
          </View>

          <Text style={styles.inputLabel}>Nome do Cartão / Banco</Text>
          <TextInput
            style={styles.textInput}
            value={cardName}
            onChangeText={setCardName}
            placeholder="Ex: Nubank, Inter, Itaú"
            placeholderTextColor="#666"
          />

          <View style={styles.rowDays}>
            <View style={styles.dayCol}>
              <Text style={styles.inputLabel}>Dia do Fechamento</Text>
              <TextInput
                style={styles.dayInput}
                keyboardType="numeric"
                maxLength={2}
                value={closingDay}
                onChangeText={(t) => setClosingDay(t.replace(/\D/g, ''))}
                placeholder="Ex: 10"
                placeholderTextColor="#666"
              />
              <Text style={styles.dayHelp}>Melhor dia de compra</Text>
            </View>

            <View style={styles.dayCol}>
              <Text style={styles.inputLabel}>Dia do Vencimento</Text>
              <TextInput
                style={styles.dayInput}
                keyboardType="numeric"
                maxLength={2}
                value={dueDay}
                onChangeText={(t) => setDueDay(t.replace(/\D/g, ''))}
                placeholder="Ex: 20"
                placeholderTextColor="#666"
              />
              <Text style={styles.dayHelp}>Dia do pagamento</Text>
            </View>
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Salvando...' : 'Salvar Cartão'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  switchLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#252525',
    color: '#FFF',
    fontSize: 15,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  rowDays: {
    flexDirection: 'row',
    gap: 12,
  },
  dayCol: {
    flex: 1,
  },
  dayInput: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
  },
  dayHelp: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6200EE',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
