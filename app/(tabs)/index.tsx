import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDI } from '../../src/presentation/di/DIContext';
import { centsToCurrency } from '../../src/core/utils/currency';
import { toMonthKey } from '../../src/core/utils/date';
import { MonthlySummary } from '../../src/domain/entities/monthly-summary';
import { FutureCommitmentThermometer } from '../../src/domain/entities/thermometer';
import { SavingsAverageSummary } from '../../src/domain/entities/savings-stats';
import { SalaryConfig } from '../../src/domain/entities/salary-config';
import { CreditCardConfig } from '../../src/domain/entities/credit-card-config';
import { CreditCardInvoiceSummary } from '../../src/domain/entities/credit-card-invoice';
import { Transaction } from '../../src/domain/entities/transaction';
import { Category } from '../../src/domain/entities/category';
import { PaymentMethod } from '../../src/domain/enums';

import { MonthSelectorHeader } from '../../src/presentation/components/MonthSelectorHeader';
import { ThermometerCard } from '../../src/presentation/components/ThermometerCard';
import { CategoryExpenseDonutChart } from '../../src/presentation/components/CategoryExpenseDonutChart';
import { SavingsAverageCard } from '../../src/presentation/components/SavingsAverageCard';
import { SalaryConfigModal } from '../../src/presentation/components/SalaryConfigModal';
import { CreditCardConfigModal } from '../../src/presentation/components/CreditCardConfigModal';
import { CreditCardInvoiceCard } from '../../src/presentation/components/CreditCardInvoiceCard';
import { AdvanceInstallmentsModal } from '../../src/presentation/components/AdvanceInstallmentsModal';
import { TransactionCard } from '../../src/presentation/components/TransactionCard';
import { TransactionDetailModal } from '../../src/presentation/components/TransactionDetailModal';

export default function DashboardScreen() {
  const router = useRouter();
  const di = useDI();

  const [currentMonthKey, setCurrentMonthKey] = useState<string>(() => toMonthKey(new Date()));
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [thermometer, setThermometer] = useState<FutureCommitmentThermometer | null>(null);
  const [savingsSummary, setSavingsSummary] = useState<SavingsAverageSummary | null>(null);
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  const [cardConfig, setCardConfig] = useState<CreditCardConfig | null>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<CreditCardInvoiceSummary | null>(null);
  const [futureInstallments, setFutureInstallments] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Map<string, Category>>(new Map());
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  const [isSalaryModalVisible, setIsSalaryModalVisible] = useState(false);
  const [isCardModalVisible, setIsCardModalVisible] = useState(false);
  const [isAdvanceModalVisible, setIsAdvanceModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // 1. Ponto único: Assegura materialização idempotente para o mês ativo antes de consultar
      await di.ensureRecurringTransactions.execute(currentMonthKey);

      // 2. Consultas em paralelo com dados consolidados
      const [sum, therm, savings, salary, card, invoice, overview, recent, cats] = await Promise.all([
        di.getMonthlySummary.execute(currentMonthKey),
        di.getThermometer.execute(currentMonthKey),
        di.getSavingsAverage.execute(6, currentMonthKey),
        di.getSalaryConfig.execute(),
        di.getCreditCardConfig.execute(),
        di.getCreditCardInvoice.execute(currentMonthKey),
        di.getCreditCardInvoicesOverview.execute(currentMonthKey),
        di.getRecentTransactions.execute(5),
        di.getCategories.execute(),
      ]);

      setSummary(sum);
      setThermometer(therm);
      setSavingsSummary(savings);
      setSalaryConfig(salary);
      setCardConfig(card);
      setInvoiceSummary(invoice);

      // Agrupa todas as parcelas futuras para o modal de antecipação
      const allFutureTxs: Transaction[] = [];
      overview.futureInvoices.forEach((fInv) => allFutureTxs.push(...fInv.transactions));
      setFutureInstallments(allFutureTxs);

      setRecentTransactions(recent);
      setCategoriesList(cats);
      setCategories(new Map(cats.map((c) => [c.id, c])));
    } catch (err) {
      console.error('Erro ao carregar dados do Dashboard:', err);
    }
  }, [di, currentMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSaveSalary = async (amountCents: number, paymentDay: number, isEnabled: boolean) => {
    await di.saveSalaryConfig.execute({ amountCents, paymentDay, isEnabled });
    await loadData();
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
    await loadData();
  };

  const handlePayInvoice = async () => {
    if (!invoiceSummary) return;
    Alert.alert(
      'Quitar Fatura',
      `Deseja marcar a fatura de ${invoiceSummary.invoiceMonth} (${centsToCurrency(invoiceSummary.totalAmountCents)}) como paga?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Pagamento',
          onPress: async () => {
            await di.payCreditCardInvoice.execute({
              invoiceMonth: invoiceSummary.invoiceMonth,
              paymentDate: invoiceSummary.dueDate,
            });
            await loadData();
            Alert.alert('Sucesso', 'Fatura marcada como paga!');
          },
        },
      ]
    );
  };

  const handleAdvanceInstallments = async (selectedIds: string[], targetDate: string) => {
    await di.advanceInstallments.execute({
      targetInvoiceMonth: currentMonthKey,
      targetDate,
      items: selectedIds.map((id) => ({ transactionId: id })),
    });
    await loadData();
    Alert.alert('Sucesso', `${selectedIds.length} parcelas antecipadas para a fatura de ${currentMonthKey}!`);
  };

  const handleOpenDetail = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsDetailModalVisible(true);
  };

  const handleUpdateTransaction = async (updated: Transaction) => {
    await di.updateTransaction.execute(updated);
    await loadData();
  };

  const handleUpdateGroup = async (groupId: string, description?: string, categoryId?: string) => {
    await di.updateTransaction.updateInstallmentGroup({
      installmentGroupId: groupId,
      description,
      categoryId,
    });
    await loadData();
  };

  const handleUpdateFutureRecurring = async (
    recurringId: string,
    fromMonthKey: string,
    description?: string,
    amountCents?: number,
    categoryId?: string,
    dayOfMonth?: number,
    paymentMethod?: PaymentMethod
  ) => {
    await di.updateRecurringTransaction.updateFutureOccurrences({
      recurringId,
      fromMonthKey,
      description,
      amountCents,
      categoryId,
      dayOfMonth,
      paymentMethod,
    });
    await loadData();
  };

  const handleDeleteSingle = async (id: string) => {
    await di.deleteTransaction.execute(id);
    await loadData();
  };

  const handleDeleteGroup = async (groupId: string) => {
    await di.deleteTransaction.executeGroup(groupId);
    await loadData();
  };

  const handleDeleteFuture = async (groupId: string, fromInstallmentNumber: number) => {
    await di.deleteTransaction.deleteCurrentAndFutureInstallments(groupId, fromInstallmentNumber);
    await loadData();
  };

  const handleSkipRecurringMonth = async (recurringId: string, monthKey: string) => {
    await di.deleteRecurringTransaction.skipMonth(recurringId, monthKey);
    await loadData();
  };

  const handleEndRecurrence = async (recurringId: string, endMonthKey: string) => {
    await di.deleteRecurringTransaction.endRecurrence(recurringId, endMonthKey);
    await loadData();
  };

  const handleDeleteAllRecurring = async (recurringId: string) => {
    await di.deleteRecurringTransaction.deleteAll(recurringId);
    await loadData();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MonthSelectorHeader
        currentMonthKey={currentMonthKey}
        onMonthChange={(newMonth) => setCurrentMonthKey(newMonth)}
      />

      {/* Cards de Resumo */}
      <View style={styles.summaryContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.cardLabel}>Saldo do Mês</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: (summary?.balanceCents ?? 0) >= 0 ? '#4CAF50' : '#FF5252' },
            ]}
          >
            {centsToCurrency(summary?.balanceCents ?? 0)}
          </Text>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.miniCard, styles.incomeCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>Receitas</Text>
              {salaryConfig && salaryConfig.isEnabled && (
                <TouchableOpacity onPress={() => setIsSalaryModalVisible(true)}>
                  <Ionicons name="briefcase" size={14} color="#4CAF50" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.incomeValue}>{centsToCurrency(summary?.totalIncomeCents ?? 0)}</Text>
            {summary && summary.fixedIncomeCents > 0 && (
              <Text style={styles.incomeDetailText}>
                Fixo: {centsToCurrency(summary.fixedIncomeCents)}
              </Text>
            )}
          </View>

          <View style={[styles.miniCard, styles.expenseCard]}>
            <Text style={styles.cardLabel}>Despesas</Text>
            <Text style={styles.expenseValue}>{centsToCurrency(summary?.totalExpenseCents ?? 0)}</Text>
          </View>
        </View>
      </View>

      {/* Card da Fatura do Cartão de Crédito */}
      {invoiceSummary && (
        <CreditCardInvoiceCard
          invoice={invoiceSummary}
          cardConfig={cardConfig}
          onPayInvoice={handlePayInvoice}
          onOpenAdvanceModal={() => setIsAdvanceModalVisible(true)}
          onConfigureCard={() => setIsCardModalVisible(true)}
        />
      )}

      {/* Gráfico de Despesas por Categoria */}
      <CategoryExpenseDonutChart
        breakdown={summary?.breakdown ?? []}
        totalExpenseCents={summary?.totalExpenseCents ?? 0}
      />

      {/* Card de Média de Sobra Mensal */}
      {savingsSummary && <SavingsAverageCard savingsSummary={savingsSummary} />}

      {/* Termômetro de Comprometimento Futuro */}
      {thermometer && <ThermometerCard thermometer={thermometer} />}

      {/* Ações Rápidas */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/transaction/new')}
        >
          <Ionicons name="add-circle" size={24} color="#FFF" />
          <Text style={styles.actionButtonText}>Nova Transação</Text>
        </TouchableOpacity>
      </View>

      {/* Transações Recentes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Últimas Transações</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {recentTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhuma transação registrada ainda.</Text>
        </View>
      ) : (
        recentTransactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            category={categories.get(tx.categoryId)}
            onPress={() => handleOpenDetail(tx)}
          />
        ))
      )}

      {/* Modais */}
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

      <AdvanceInstallmentsModal
        visible={isAdvanceModalVisible}
        futureInstallments={futureInstallments}
        targetInvoiceMonth={currentMonthKey}
        onAdvance={handleAdvanceInstallments}
        onClose={() => setIsAdvanceModalVisible(false)}
      />

      <TransactionDetailModal
        visible={isDetailModalVisible}
        transaction={selectedTransaction}
        category={selectedTransaction ? categories.get(selectedTransaction.categoryId) : undefined}
        allCategories={categoriesList}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedTransaction(null);
        }}
        onUpdate={handleUpdateTransaction}
        onUpdateGroup={handleUpdateGroup}
        onUpdateFutureRecurring={handleUpdateFutureRecurring}
        onDeleteSingle={handleDeleteSingle}
        onDeleteGroup={handleDeleteGroup}
        onDeleteFuture={handleDeleteFuture}
        onSkipRecurringMonth={handleSkipRecurringMonth}
        onEndRecurrence={handleEndRecurrence}
        onDeleteAllRecurring={handleDeleteAllRecurring}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingBottom: 24,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  balanceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  rowCards: {
    flexDirection: 'row',
    gap: 10,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF5252',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  incomeDetailText: {
    color: '#777',
    fontSize: 11,
    marginTop: 3,
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5252',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6200EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#BB86FC',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});
