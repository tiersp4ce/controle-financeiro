import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateCategoryModalProps {
  visible: boolean;
  onSave: (name: string, iconKey: string, colorHex: string) => Promise<void>;
  onClose: () => void;
}

const AVAILABLE_COLORS = [
  '#FF7043', '#42A5F5', '#AB47BC', '#26A69A', '#EF5350',
  '#66BB6A', '#FFA726', '#EC407A', '#7E57C2', '#29B6F6',
];

const AVAILABLE_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'fast-food', 'home', 'car', 'game-controller', 'medkit',
  'cash', 'trending-up', 'apps', 'cart', 'school',
  'fitness', 'airplane', 'gift', 'cafe', 'briefcase', 'paw',
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  visible,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert('Nome inválido', 'O nome da categoria deve ter no mínimo 2 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(trimmed, selectedIcon, selectedColor);
      setName('');
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao criar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Nova Categoria</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.label}>Nome da Categoria</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Assinaturas, Pets, Farmácia"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              maxLength={30}
            />

            {/* Pré-visualização */}
            <Text style={styles.label}>Prévia</Text>
            <View style={styles.previewContainer}>
              <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                <Ionicons name={selectedIcon} size={22} color="#FFF" />
              </View>
              <Text style={styles.previewName}>{name.trim() || 'Nome da Categoria'}</Text>
            </View>

            {/* Paleta de Cores */}
            <Text style={styles.label}>Cor</Text>
            <View style={styles.colorPalette}>
              {AVAILABLE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorCircleSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Seletor de Ícones */}
            <Text style={styles.label}>Ícone</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconBox,
                    selectedIcon === icon && styles.iconBoxSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons
                    name={icon}
                    size={22}
                    color={selectedIcon === icon ? '#BB86FC' : '#AAA'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, name.trim().length < 2 && styles.btnDisabled]}
              onPress={handleSave}
              disabled={isSubmitting || name.trim().length < 2}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? 'Salvando...' : 'Criar Categoria'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 18,
  },
  label: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#262626',
    color: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#383838',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#383838',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#383838',
  },
  iconBoxSelected: {
    borderColor: '#BB86FC',
    backgroundColor: '#2F1E44',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6200EE',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
