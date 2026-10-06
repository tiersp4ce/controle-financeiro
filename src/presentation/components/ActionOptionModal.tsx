import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ActionOption {
  key: string;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: 'default' | 'destructive' | 'cancel';
  onPress: () => void | Promise<void>;
}

interface ActionOptionModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: ActionOption[];
  onClose: () => void;
}

/**
 * Modal multiplataforma didático para escolha de ações.
 *
 * Substitui o Alert.alert nativo que não suporta mais de 2 botões na Web,
 * garantindo compatibilidade uniforme em Android, iOS e navegadores (Vercel).
 */
export const ActionOptionModal: React.FC<ActionOptionModalProps> = ({
  visible,
  title,
  subtitle,
  options,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>

              <View style={styles.optionsList}>
                {options.map((option, index) => {
                  const isDestructive = option.style === 'destructive';
                  const isCancel = option.style === 'cancel';

                  return (
                    <TouchableOpacity
                      key={option.key || index}
                      style={[
                        styles.optionButton,
                        isDestructive && styles.destructiveButton,
                        isCancel && styles.cancelButton,
                      ]}
                      onPress={async () => {
                        onClose();
                        await option.onPress();
                      }}
                      activeOpacity={0.7}
                    >
                      {option.icon ? (
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={
                            isDestructive ? '#FF5252' : isCancel ? '#888' : '#03DAC6'
                          }
                          style={styles.optionIcon}
                        />
                      ) : null}

                      <View style={styles.optionTextContainer}>
                        <Text
                          style={[
                            styles.optionLabel,
                            isDestructive && styles.destructiveLabel,
                            isCancel && styles.cancelLabel,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.description ? (
                          <Text style={styles.optionDescription}>
                            {option.description}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  optionsList: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  destructiveButton: {
    backgroundColor: '#2C1717',
    borderColor: '#FF525244',
  },
  cancelButton: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2E2E2E',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  destructiveLabel: {
    color: '#FF5252',
  },
  cancelLabel: {
    color: '#AAA',
  },
  optionDescription: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
});
