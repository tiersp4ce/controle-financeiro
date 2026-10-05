import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDI } from '../../src/presentation/di/DIContext';
import { PinKeyboard } from '../../src/presentation/components/PinKeyboard';

export default function PinSetupScreen() {
  const router = useRouter();
  const di = useDI();

  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const currentVal = step === 'enter' ? pin : confirmPin;

  const handleKeyPress = async (digit: string) => {
    if (currentVal.length >= 4) return;
    const newVal = currentVal + digit;

    if (step === 'enter') {
      setPin(newVal);
      if (newVal.length === 4) {
        setTimeout(() => setStep('confirm'), 200);
      }
    } else {
      setConfirmPin(newVal);
      if (newVal.length === 4) {
        if (newVal === pin) {
          try {
            await di.setPin.execute(newVal);
            Alert.alert('Sucesso', 'PIN de 4 dígitos configurado!');
            router.back();
          } catch (err: any) {
            Alert.alert('Erro', err.message || 'Falha ao salvar PIN');
          }
        } else {
          Alert.alert('Atenção', 'Os PINs digitados não conferem.');
          setStep('enter');
          setPin('');
          setConfirmPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {step === 'enter' ? 'Digite seu novo PIN de 4 dígitos' : 'Confirme seu novo PIN'}
      </Text>

      {/* Indicador visual de 4 bolinhas */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = idx < currentVal.length;
          return <View key={idx} style={[styles.dot, isFilled && styles.dotFilled]} />;
        })}
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
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
    borderColor: '#6200EE',
  },
  dotFilled: {
    backgroundColor: '#6200EE',
  },
});
