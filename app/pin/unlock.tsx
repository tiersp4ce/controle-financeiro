import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDI } from '../../src/presentation/di/DIContext';
import { PinKeyboard } from '../../src/presentation/components/PinKeyboard';

export default function PinUnlockScreen() {
  const router = useRouter();
  const di = useDI();
  const [pin, setPin] = useState('');

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4) return;
    const newVal = pin + digit;
    setPin(newVal);

    if (newVal.length === 4) {
      const isValid = await di.verifyPin.execute(newVal);
      if (isValid) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Erro', 'PIN incorreto. Tente novamente.');
        setPin('');
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aplicativo Bloqueado</Text>
      <Text style={styles.subtitle}>Digite o PIN para continuar</Text>

      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((idx) => (
          <View key={idx} style={[styles.dot, idx < pin.length && styles.dotFilled]} />
        ))}
      </View>

      <PinKeyboard onKeyPress={handleKeyPress} onDelete={handleDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#03DAC6',
  },
  dotFilled: {
    backgroundColor: '#03DAC6',
  },
});
