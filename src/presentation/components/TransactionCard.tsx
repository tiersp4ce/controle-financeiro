import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../domain/entities/transaction';
import { Category } from '../../domain/entities/category';
import { centsToCurrency } from '../../core/utils/currency';
import { formatDateBr } from '../../core/utils/date';
import { TransactionType } from '../../domain/enums';

interface TransactionCardProps {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  category,
  onPress,
}) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const amountColor = isIncome ? '#4CAF50' : '#FF5252';
  const prefix = isIncome ? '+' : '-';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: category?.colorHex ?? '#333' }]}>
        <Ionicons name={(category?.iconKey as any) ?? 'card'} size={20} color="#FFF" />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.subtitle}>
          {category?.name ?? 'Sem categoria'} • {formatDateBr(transaction.date)}
        </Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {prefix} {centsToCurrency(transaction.amountCents)}
        </Text>
        {transaction.installmentNumber && transaction.totalInstallments ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {transaction.installmentNumber}/{transaction.totalInstallments}
            </Text>
          </View>
        ) : Boolean(transaction.recurringTransactionId || transaction.recurrence === 'MONTHLY') ? (
          <View style={[styles.badge, styles.recurringBadge]}>
            <Text style={styles.recurringBadgeText}>Fixa</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  description: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    color: '#AAA',
    fontSize: 10,
    fontWeight: '600',
  },
  recurringBadge: {
    backgroundColor: '#1E3A2F',
    borderWidth: 1,
    borderColor: '#4CAF5055',
  },
  recurringBadgeText: {
    color: '#81C784',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
