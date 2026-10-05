import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavingsAverageSummary } from '../../domain/entities/savings-stats';
import { centsToCurrency } from '../../core/utils/currency';

interface SavingsAverageCardProps {
  savingsSummary: SavingsAverageSummary;
}

export const SavingsAverageCard: React.FC<SavingsAverageCardProps> = ({ savingsSummary }) => {
  const getStatusColor = () => {
    switch (savingsSummary.financialHealthStatus) {
      case 'EXCELLENT':
        return '#00E676';
      case 'GOOD':
        return '#03DAC6';
      case 'WARNING':
        return '#FFC107';
      case 'CRITICAL':
        return '#FF5252';
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (savingsSummary.financialHealthStatus) {
      case 'EXCELLENT':
        return 'shield-checkmark';
      case 'GOOD':
        return 'trending-up';
      case 'WARNING':
        return 'alert-circle';
      case 'CRITICAL':
        return 'warning';
    }
  };

  const statusColor = getStatusColor();
  const isPositiveSavings = savingsSummary.averageMonthlySavingsCents >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={getStatusIcon()} size={20} color={statusColor} />
          <Text style={styles.title}>Média de Sobra Mensal</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {savingsSummary.averageSavingsRatePercentage}% poupado
          </Text>
        </View>
      </View>

      <View style={styles.mainMetrics}>
        <Text style={styles.metricLabel}>Sobra Média ({savingsSummary.evaluatedMonthsCount} meses)</Text>
        <Text
          style={[
            styles.metricValue,
            { color: isPositiveSavings ? '#4CAF50' : '#FF5252' },
          ]}
        >
          {centsToCurrency(savingsSummary.averageMonthlySavingsCents)}
        </Text>
      </View>

      <View style={styles.subMetricsRow}>
        <View style={styles.subMetric}>
          <Text style={styles.subMetricLabel}>Melhor Mês</Text>
          <Text style={styles.subMetricValueGreen}>
            {centsToCurrency(savingsSummary.bestMonthSavingsCents)}
          </Text>
        </View>
        <View style={styles.subMetricDivider} />
        <View style={styles.subMetric}>
          <Text style={styles.subMetricLabel}>Pior Mês</Text>
          <Text
            style={
              savingsSummary.worstMonthSavingsCents >= 0
                ? styles.subMetricValue
                : styles.subMetricValueRed
            }
          >
            {centsToCurrency(savingsSummary.worstMonthSavingsCents)}
          </Text>
        </View>
      </View>

      <View style={styles.insightBox}>
        <Text style={styles.insightText}>{savingsSummary.insightMessage}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mainMetrics: {
    marginVertical: 4,
  },
  metricLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  subMetric: {
    flex: 1,
    alignItems: 'center',
  },
  subMetricDivider: {
    width: 1,
    backgroundColor: '#2A2A2A',
  },
  subMetricLabel: {
    color: '#777',
    fontSize: 11,
    marginBottom: 2,
  },
  subMetricValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  subMetricValueGreen: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
  },
  subMetricValueRed: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: '600',
  },
  insightBox: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },
  insightText: {
    color: '#AAA',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
