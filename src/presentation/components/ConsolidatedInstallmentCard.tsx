import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../../domain/entities/category';
import { centsToCurrency } from '../../core/utils/currency';
import { formatDateBr } from '../../core/utils/date';

interface ConsolidatedInstallmentCardProps {
  description: string;
  totalAmountCents: number;
  totalInstallments: number;
  paidInstallmentsCount: number;
  installmentAmountCents: number;
  purchaseDate: string;
  category?: Category;
  onPress: () => void;
}

/**
 * Card para exibição consolidada de compras parceladas no feed de Atividades Recentes.
 * Mostra o nome do produto sem sufixo repetido, progresso de quitação e resumo financeiro.
 */
export const ConsolidatedInstallmentCard: React.FC<ConsolidatedInstallmentCardProps> = ({
  description,
  totalAmountCents,
  totalInstallments,
  paidInstallmentsCount,
  installmentAmountCents,
  purchaseDate,
  category,
  onPress,
}) => {
  const progressPercent =
    totalInstallments > 0
      ? Math.round((paidInstallmentsCount / totalInstallments) * 100)
      : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={[styles.categoryIcon, { backgroundColor: category?.colorHex ?? '#6200EE' }]}>
          <Ionicons name={(category?.iconKey as any) ?? 'card'} size={18} color="#FFF" />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>
            {description}
          </Text>
          <Text style={styles.subtitle}>
            Compra em {formatDateBr(purchaseDate)} • {totalInstallments}x de {centsToCurrency(installmentAmountCents)}
          </Text>
        </View>

        <View style={styles.amountCol}>
          <Text style={styles.totalAmount}>{centsToCurrency(totalAmountCents)}</Text>
          <View style={styles.badge}>
            <Ionicons name="layers-outline" size={11} color="#BB86FC" />
            <Text style={styles.badgeText}>Parcelado</Text>
          </View>
        </View>
      </View>

      {/* Barra de Progresso de Parcelas Pagas */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {paidInstallmentsCount} de {totalInstallments} parcelas pagas ({progressPercent}%)
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    color: '#FF5252',
    fontSize: 15,
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BB86FC22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    marginTop: 3,
  },
  badgeText: {
    color: '#BB86FC',
    fontSize: 10,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    color: '#AAA',
    fontSize: 11,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E676',
    borderRadius: 3,
  },
});
