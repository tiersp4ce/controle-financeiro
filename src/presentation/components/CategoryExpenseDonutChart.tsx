import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { CategoryExpenseBreakdown } from '../../domain/entities/monthly-summary';
import { centsToCurrency } from '../../core/utils/currency';

interface CategoryExpenseDonutChartProps {
  breakdown: CategoryExpenseBreakdown[];
  totalExpenseCents: number;
}

export const CategoryExpenseDonutChart: React.FC<CategoryExpenseDonutChartProps> = ({
  breakdown,
  totalExpenseCents,
}) => {
  if (totalExpenseCents === 0 || breakdown.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Despesas por Categoria</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma despesa registrada neste mês.</Text>
        </View>
      </View>
    );
  }

  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Despesas por Categoria</Text>

      <View style={styles.chartWrapper}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Background ring */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#2A2A2A"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {breakdown.map((item) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percentage;

              return (
                <Circle
                  key={item.categoryId}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={item.categoryColor || '#9E9E9E'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.donutCenterLabel}>
          <Text style={styles.donutCenterTitle}>Total</Text>
          <Text style={styles.donutCenterValue}>{centsToCurrency(totalExpenseCents)}</Text>
        </View>
      </View>

      {/* Legend / Category Breakdown */}
      <View style={styles.legendContainer}>
        {breakdown.map((item) => (
          <View key={item.categoryId} style={styles.legendItem}>
            <View style={styles.legendRow}>
              <View style={[styles.colorDot, { backgroundColor: item.categoryColor || '#9E9E9E' }]} />
              <Text style={styles.categoryName} numberOfLines={1}>
                {item.categoryName}
              </Text>
              <Text style={styles.categoryAmount}>{centsToCurrency(item.totalCents)}</Text>
              <Text style={styles.categoryPercent}>{item.percentage}%</Text>
            </View>
            <View style={styles.miniProgressBarBg}>
              <View
                style={[
                  styles.miniProgressBarFill,
                  {
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.categoryColor || '#9E9E9E',
                  },
                ]}
              />
            </View>
          </View>
        ))}
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
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 13,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  donutCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterTitle: {
    color: '#888',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  donutCenterValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  legendContainer: {
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    color: '#DDD',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryAmount: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  categoryPercent: {
    color: '#888',
    fontSize: 12,
    width: 44,
    textAlign: 'right',
  },
  miniProgressBarBg: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
