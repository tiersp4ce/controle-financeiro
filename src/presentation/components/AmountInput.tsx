import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { formatCentsInput } from '../../core/utils/currency';
import { TransactionType } from '../../domain/enums';

interface AmountInputProps {
  cents: number;
  onChangeCents: (cents: number) => void;
  type: TransactionType;
}

export const AmountInput: React.FC<AmountInputProps> = ({ cents, onChangeCents, type }) => {
  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const numericValue = digits ? parseInt(digits, 10) : 0;
    onChangeCents(numericValue);
  };

  const isIncome = type === TransactionType.INCOME;
  const textColor = isIncome ? '#4CAF50' : '#FF5252';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Valor</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        keyboardType="numeric"
        value={formatCentsInput(cents)}
        onChangeText={handleChangeText}
        selectTextOnFocus
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  input: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
