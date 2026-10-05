import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AmountInput } from './AmountInput';
import { TransactionType } from '../../domain/enums';
import { SalaryConfig } from '../../domain/entities/salary-config';

interface SalaryConfigModalProps {
  visible: boolean;
  currentConfig: SalaryConfig | null;
  onSave: (amountCents: number, paymentDay: number, isEnabled: boolean) => Promise<void>;
  onClose: () => void;
}

export const SalaryConfigModal: React.FC<SalaryConfigModalProps> = ({
  visible,
  currentConfig,
  onSave,
  onClose,
}) => {
  const [amountCents, setAmountCents] = useState(0);
  const [paymentDay, setPaymentDay] = useState('5');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (currentConfig) {
        setAmountCents(currentConfig.amountCents);
        setPaymentDay(String(currentConfig.paymentDay));
        setIsEnabled(currentConfig.isEnabled);
      } else {
        setAmountCents(0);
        setPaymentDay('5');
        setIsEnabled(true);
      }
      setErrorMessage(null);
    }
  }, [visible, currentConfig]);

  const handleSave = async () => {
    setErrorMessage(null);
    const day = parseInt(paymentDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      setErrorMessage('O dia de recebimento deve ser entre 1 e 31.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(amountCents, day, isEnabled);
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
          <Text style={styles.title}>Configurar Salário Fixo</Text>
          <Text style={styles.subtitle}>
            Sua renda fixa mensal recorrente será contabilizada automaticamente todo mês.
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Salário Ativo</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              thumbColor={isEnabled ? '#03DAC6' : '#666'}
              trackColor={{ false: '#333', true: '#03DAC644' }}
            />
          </View>

          <AmountInput
            cents={amountCents}
            onChangeCents={setAmountCents}
            type={TransactionType.INCOME}
          />

          <View style={styles.dayInputContainer}>
            <Text style={styles.dayLabel}>Dia do Recebimento (1 a 31)</Text>
            <TextInput
              style={styles.dayInput}
              keyboardType="numeric"
              maxLength={2}
              value={paymentDay}
              onChangeText={(t) => setPaymentDay(t.replace(/\D/g, ''))}
              placeholder="Ex: 5"
              placeholderTextColor="#666"
            />
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Salvando...' : 'Salvar Salário'}
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
    marginBottom: 8,
  },
  switchLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dayInputContainer: {
    marginVertical: 10,
  },
  dayLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
  },
  dayInput: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 13,
    marginTop: 6,
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
