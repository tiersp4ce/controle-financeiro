import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDI } from '../../src/presentation/di/DIContext';
import { SalaryConfig } from '../../src/domain/entities/salary-config';
import { CreditCardConfig } from '../../src/domain/entities/credit-card-config';
import { RecurringTransaction } from '../../src/domain/entities/recurring-transaction';
import { SalaryConfigModal } from '../../src/presentation/components/SalaryConfigModal';
import { CreditCardConfigModal } from '../../src/presentation/components/CreditCardConfigModal';
import { centsToCurrency } from '../../src/core/utils/currency';

export default function SettingsScreen() {
  const router = useRouter();
  const di = useDI();
  const [hasPin, setHasPin] = useState(false);
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  const [cardConfig, setCardConfig] = useState<CreditCardConfig | null>(null);
  const [activeRecurrings, setActiveRecurrings] = useState<RecurringTransaction[]>([]);
  const [isSalaryModalVisible, setIsSalaryModalVisible] = useState(false);
  const [isCardModalVisible, setIsCardModalVisible] = useState(false);

  const loadSettings = async () => {
    const [pinSet, salary, card, recList] = await Promise.all([
      di.isPinSet.execute(),
      di.getSalaryConfig.execute(),
      di.getCreditCardConfig.execute(),
      di.getRecurringTransactions.executeActive(),
    ]);
    setHasPin(pinSet);
    setSalaryConfig(salary);
    setCardConfig(card);
    setActiveRecurrings(recList);
  };

  useEffect(() => {
    loadSettings();
  }, [di]);

  const handleSaveSalary = async (amountCents: number, paymentDay: number, isEnabled: boolean) => {
    await di.saveSalaryConfig.execute({ amountCents, paymentDay, isEnabled });
    await loadSettings();
    Alert.alert('Sucesso', 'Configuração de salário atualizada com sucesso!');
  };

  const handleSaveCard = async (
    cardName: string,
    closingDay: number,
    dueDay: number,
    limitCents: number,
    isEnabled: boolean
  ) => {
    await di.saveCreditCardConfig.execute({
      cardName,
      closingDay,
      dueDay,
      limitCents,
      isEnabled,
    });
    await loadSettings();
    Alert.alert('Sucesso', 'Configuração do cartão de crédito atualizada!');
  };

  const handleExportBackup = async () => {
    try {
      await di.exportBackup.execute();
      Alert.alert('Sucesso', 'Backup JSON exportado com sucesso!');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao exportar backup');
    }
  };

  const handleImportBackup = async () => {
    try {
      const res = await di.importBackup.execute();
      await loadSettings();
      Alert.alert(
        'Sucesso',
        `Backup restaurado com sucesso!
${res.transactionCount} transações, ${res.categoryCount} categorias e ${res.recurringCount} regras recorrentes carregadas.`
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao importar backup');
    }
  };

  const getSalarySubtitle = () => {
    if (!salaryConfig || !salaryConfig.isEnabled || salaryConfig.amountCents === 0) {
      return 'Nenhum salário configurado • Toque para definir';
    }
    return `${centsToCurrency(salaryConfig.amountCents)} • Todo dia ${salaryConfig.paymentDay}`;
  };

  const getCardSubtitle = () => {
    if (!cardConfig || !cardConfig.isEnabled) {
      return 'Cartão desativado • Toque para configurar';
    }
    return `${cardConfig.cardName} • Fecha dia ${cardConfig.closingDay} / Vence dia ${cardConfig.dueDay}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Renda & Cartões</Text>
      <TouchableOpacity
        style={styles.item}
        onPress={() => setIsSalaryModalVisible(true)}
      >
        <Ionicons name="briefcase" size={22} color="#4CAF50" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>Salário Fixo Mensal</Text>
          <Text style={styles.itemSubtitle}>{getSalarySubtitle()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => setIsCardModalVisible(true)}
      >
        <Ionicons name="card" size={22} color="#FFA726" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>Cartão de Crédito (Fatura)</Text>
          <Text style={styles.itemSubtitle}>{getCardSubtitle()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <View style={styles.item}>
        <Ionicons name="repeat" size={22} color="#81C784" />
        <View style={styles.itemInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.itemTitle}>Despesas / Receitas Fixas</Text>
            <View style={{ backgroundColor: '#FF980025', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ color: '#FF9800', fontSize: 10, fontWeight: '700' }}>EM DESENVOLVIMENTO</Text>
            </View>
          </View>
          <Text style={styles.itemSubtitle}>
            Gerenciador avançado de regras fixas em breve
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Segurança</Text>
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push('/pin/setup')}
      >
        <Ionicons name="lock-closed" size={22} color="#03DAC6" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>Bloqueio por PIN (4 Dígitos)</Text>
          <Text style={styles.itemSubtitle}>
            {hasPin ? 'PIN Ativo • Toque para alterar' : 'PIN Desativado • Toque para configurar'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Dados & Backup Offline</Text>
      <TouchableOpacity style={styles.item} onPress={handleExportBackup}>
        <Ionicons name="cloud-upload" size={22} color="#4CAF50" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>Exportar Backup JSON</Text>
          <Text style={styles.itemSubtitle}>Salva transações, recorrências, salário e cartões</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={handleImportBackup}>
        <Ionicons name="cloud-download" size={22} color="#FFA726" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>Restaurar Backup JSON</Text>
          <Text style={styles.itemSubtitle}>Substitui a base atual por um arquivo de backup</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <SalaryConfigModal
        visible={isSalaryModalVisible}
        currentConfig={salaryConfig}
        onSave={handleSaveSalary}
        onClose={() => setIsSalaryModalVisible(false)}
      />

      <CreditCardConfigModal
        visible={isCardModalVisible}
        currentConfig={cardConfig}
        onSave={handleSaveCard}
        onClose={() => setIsCardModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  itemSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
});
