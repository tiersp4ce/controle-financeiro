import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDI } from '../../src/presentation/di/DIContext';
import { toMonthKey } from '../../src/core/utils/date';
import { Transaction } from '../../src/domain/entities/transaction';
import { Category } from '../../src/domain/entities/category';
import { PaymentMethod } from '../../src/domain/enums';
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

  return (
    <View style={styles.container}>
      <MonthSelectorHeader
        currentMonthKey={currentMonthKey}
        onMonthChange={(newMonth) => setCurrentMonthKey(newMonth)}
      />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            category={categoriesMap.get(item.categoryId)}
            onPress={() => handleOpenDetail(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>Nenhuma transação neste mês.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

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
  listContent: {
    paddingBottom: 80,
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
