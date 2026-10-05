import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FutureCommitmentThermometer } from '../../domain/entities/thermometer';
import { centsToCurrency } from '../../core/utils/currency';

interface ThermometerCardProps {
  thermometer: FutureCommitmentThermometer;
}

export const ThermometerCard: React.FC<ThermometerCardProps> = ({ thermometer }) => {
  const getLevelColor = () => {
    switch (thermometer.level) {
      case 'GREEN':
        return '#4CAF50';
      case 'YELLOW':
        return '#FFC107';
      case 'RED':
        return '#FF5252';
      case 'GRAY':
        return '#888888';
    }
  };

  const color = getLevelColor();
  const isGray = thermometer.level === 'GRAY';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Renda Comprometida</Text>
        <Text style={[styles.percentage, { color }]}>
          {isGray ? '--' : `${thermometer.commitmentPercentage}%`}
        </Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: isGray ? '0%' : `${Math.min(thermometer.commitmentPercentage, 100)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>
          Comprometido: {centsToCurrency(thermometer.totalCommittedCents)}
        </Text>
        <Text style={styles.detailText}>
          Renda Estimada: {centsToCurrency(thermometer.totalProjectedIncomeCents)}
        </Text>
      </View>

      <Text style={styles.feedback}>{thermometer.feedbackMessage}</Text>
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
    marginBottom: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  percentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  feedback: {
    color: '#CCC',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
