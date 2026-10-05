import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PinKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
}

export const PinKeyboard: React.FC<PinKeyboardProps> = ({ onKeyPress, onDelete }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];

  return (
    <View style={styles.container}>
      {keys.map((key, index) => {
        if (key === '') {
          return <View key={index} style={styles.emptyKey} />;
        }
        if (key === 'DEL') {
          return (
            <TouchableOpacity key={index} style={styles.key} onPress={onDelete}>
              <Ionicons name="backspace-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity key={index} style={styles.key} onPress={() => onKeyPress(key)}>
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 280,
    marginTop: 20,
  },
  key: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  emptyKey: {
    width: 75,
    height: 75,
    margin: 8,
  },
  keyText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
});
