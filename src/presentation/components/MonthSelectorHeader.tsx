import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMonthYearBr, shiftMonthKey } from '../../core/utils/date';

interface MonthSelectorHeaderProps {
  currentMonthKey: string;
  onMonthChange: (monthKey: string) => void;
}

export const MonthSelectorHeader: React.FC<MonthSelectorHeaderProps> = ({
  currentMonthKey,
  onMonthChange,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onMonthChange(shiftMonthKey(currentMonthKey, -1))}
      >
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </TouchableOpacity>

      <Text style={styles.title}>{formatMonthYearBr(currentMonthKey)}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onMonthChange(shiftMonthKey(currentMonthKey, 1))}
      >
        <Ionicons name="chevron-forward" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  button: {
    padding: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
