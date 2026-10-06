import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDI } from '../../src/presentation/di/DIContext';
import { toMonthKey } from '../../src/core/utils/date';
import { centsToCurrency } from '../../src/core/utils/currency';
import { Transaction } from '../../src/domain/entities/transaction';
import { Category } from '../../src/domain/entities/category';
import { PaymentMethod, TransactionType } from '../../src/domain/enums';
import { MonthSelectorHeader } from '../../src/presentation/components/MonthSelectorHeader';
import { TransactionCard } from '../../src/presentation/components/TransactionCard';
import { TransactionDetailModal } from '../../src/presentation/components/TransactionDetailModal';

export default function TransactionsScreen() {
  const router = useRouter();
  const di = useDI();

  const [currentMonthKey, setCurrentMonthKey] = useState<string>(() => toMonthKey(new Date()));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<string, Category>>(new Map());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      // 1. Ponto único: Assegura materialização idempotente para o mês ativo antes de consultar
      await di.ensureRecurringTransactions.execute(currentMonthKey);

      const [txList, catList] = await Promise.all([
        di.getTransactionsByMonth.execute(currentMonthKey),
        di.getCategories.execute(),
      ]);
      setTransactions(txList);
      setCategories(catList);
      setCategoriesMap(new Map(catList.map((c) => [c.id, c])));
    } catch (err) {
      console.error('Erro ao carregar extrato:', err);
    }
  }, [di, currentMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const handleOpenDetail = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsDetailModalVisible(true);
  };

  const handleUpdateTransaction = async (updated: Transaction) => {
    await di.updateTransaction.execute(updated);
    await loadTransactions();
  };

  const handleUpdateGroup = async (groupId: string, description?: string, categoryId?: string) => {
    await di.updateTransaction.updateInstallmentGroup({
      installmentGroupId: groupId,
      description,
      categoryId,
    });
    await loadTransactions();
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
    await loadTransactions();
  };

  const handleDeleteSingle = async (id: string) => {
    await di.deleteTransaction.execute(id);
    await loadTransactions();
  };

  const handleDeleteGroup = async (groupId: string) => {
    await di.deleteTransaction.executeGroup(groupId);
    await loadTransactions();
  };

  const handleDeleteFuture = async (groupId: string, fromInstallmentNumber: number) => {
    await di.deleteTransaction.deleteCurrentAndFutureInstallments(groupId, fromInstallmentNumber);
    await loadTransactions();
  };

  const handleSkipRecurringMonth = async (recurringId: string, monthKey: string) => {
    await di.deleteRecurringTransaction.skipMonth(recurringId, monthKey);
    await loadTransactions();
  };

  const handleEndRecurrence = async (recurringId: string, endMonthKey: string) => {
    await di.deleteRecurringTransaction.endRecurrence(recurringId, endMonthKey);
    await loadTransactions();
  };

  const handleDeleteAllRecurring = async (recurringId: string) => {
    await di.deleteRecurringTransaction.deleteAll(recurringId);
    await loadTransactions();
  };

  // Separação contábil do extrato
  const unpaidExpenses = transactions.filter(
    (t) => t.type === TransactionType.EXPENSE && !t.isPaid
  );
  const paidItems = transactions.filter(
    (t) => t.type === TransactionType.EXPENSE && t.isPaid
  );
  const incomes = transactions.filter(
    (t) => t.type === TransactionType.INCOME
  );

  // Subtotais sempre em centavos inteiros (sem risco de arredondamento flutuante)
  const totalPendingCents = unpaidExpenses.reduce((sum, t) => sum + t.amountCents, 0);
  const totalPaidCents = paidItems.reduce((sum, t) => sum + t.amountCents, 0);
  const totalIncomeCents = incomes.reduce((sum, t) => sum + t.amountCents, 0);

  const hasAnyTransactions = transactions.length > 0;

  return (
    <View style={styles.container}>
      <MonthSelectorHeader
        currentMonthKey={currentMonthKey}
        onMonthChange={(newMonth) => setCurrentMonthKey(newMonth)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!hasAnyTransactions ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>Nenhuma transação neste mês.</Text>
          </View>
        ) : (
          <>
            {/* SEÇÃO 1: RECEITAS (SE HOUVER) */}
            {incomes.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="trending-up" size={18} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Receitas</Text>
                    <View style={[styles.countBadge, styles.incomeCountBadge]}>
                      <Text style={styles.incomeCountBadgeText}>{incomes.length}</Text>
                    </View>
                  </View>
                  <Text style={styles.sectionTotalIncome}>
                    + {centsToCurrency(totalIncomeCents)}
                  </Text>
                </View>

                {incomes.map((item) => (
                  <TransactionCard
                    key={item.id}
                    transaction={item}
                    category={categoriesMap.get(item.categoryId)}
                    onPress={() => handleOpenDetail(item)}
                  />
                ))}
              </View>
            )}

            {/* SEÇÃO 2 (TOPO): EM ABERTO / A PAGAR */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="time-outline" size={18} color="#FFA726" />
                  <Text style={styles.sectionTitle}>Em Aberto / A Pagar</Text>
                  <View style={[styles.countBadge, styles.pendingCountBadge]}>
                    <Text style={styles.pendingCountBadgeText}>{unpaidExpenses.length}</Text>
                  </View>
                </View>
                <Text style={styles.sectionTotalPending}>
                  {centsToCurrency(totalPendingCents)}
                </Text>
              </View>

              {unpaidExpenses.length === 0 ? (
                <View style={styles.sectionEmptyBox}>
                  <Ionicons name="checkmark-done-circle-outline" size={24} color="#4CAF50" />
                  <Text style={styles.sectionEmptyText}>
                    Tudo em dia! Nenhuma despesa pendente neste mês.
                  </Text>
                </View>
              ) : (
                unpaidExpenses.map((item) => (
                  <TransactionCard
                    key={item.id}
                    transaction={item}
                    category={categoriesMap.get(item.categoryId)}
                    onPress={() => handleOpenDetail(item)}
                  />
                ))
              )}
            </View>

            {/* SEÇÃO 3 (EMBAIXO): QUITADAS COM IDENTIDADE AZUL */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#2196F3" />
                  <Text style={styles.sectionTitle}>Quitadas</Text>
                  <View style={[styles.countBadge, styles.paidCountBadge]}>
                    <Text style={styles.paidCountBadgeText}>{paidItems.length}</Text>
                  </View>
                </View>
                <Text style={styles.sectionTotalPaid}>
                  {centsToCurrency(totalPaidCents)}
                </Text>
              </View>

              {paidItems.length === 0 ? (
                <View style={styles.sectionEmptyBox}>
                  <Ionicons name="hourglass-outline" size={22} color="#666" />
                  <Text style={styles.sectionEmptyText}>
                    Nenhuma despesa quitada neste mês ainda.
                  </Text>
                </View>
              ) : (
                paidItems.map((item) => (
                  <TransactionCard
                    key={item.id}
                    transaction={item}
                    category={categoriesMap.get(item.categoryId)}
                    onPress={() => handleOpenDetail(item)}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/transaction/new')}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <TransactionDetailModal
        visible={isDetailModalVisible}
        transaction={selectedTransaction}
        category={selectedTransaction ? categoriesMap.get(selectedTransaction.categoryId) : undefined}
        allCategories={categories}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#EEE',
    fontSize: 15,
    fontWeight: 'bold',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingCountBadge: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
  },
  pendingCountBadgeText: {
    color: '#FFA726',
    fontSize: 11,
    fontWeight: 'bold',
  },
  paidCountBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  paidCountBadgeText: {
    color: '#2196F3',
    fontSize: 11,
    fontWeight: 'bold',
  },
  incomeCountBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  incomeCountBadgeText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTotalPending: {
    color: '#FFA726',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionTotalPaid: {
    color: '#2196F3',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionTotalIncome: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionEmptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  sectionEmptyText: {
    color: '#888',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200EE',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
