import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDI } from '../../src/presentation/di/DIContext';
import { Category } from '../../src/domain/entities/category';
import { CreateCategoryModal } from '../../src/presentation/components/CreateCategoryModal';

export default function CategoriesScreen() {
  const di = useDI();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const list = await di.getCategories.execute();
      setCategories(list);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, [di]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const handleCreateCategory = async (name: string, iconKey: string, colorHex: string) => {
    await di.createCategory.execute(name, iconKey, colorHex);
    await loadCategories();
  };

  const handleDeleteCategory = (cat: Category) => {
    const doDelete = async () => {
      try {
        await di.deleteCategory.execute(cat.id);
        await loadCategories();
        if (Platform.OS === 'web') {
          window.alert(`Categoria "${cat.name}" excluída.`);
        } else {
          Alert.alert('Sucesso', `Categoria "${cat.name}" excluída.`);
        }
      } catch (err: any) {
        const msg = err.message || 'Não foi possível excluir a categoria.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Não é possível excluir', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja realmente excluir a categoria "${cat.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Excluir Categoria',
        `Deseja realmente excluir "${cat.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categorias</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addButtonText}>Nova Categoria</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: item.colorHex }]}>
              <Ionicons name={(item.iconKey as any) ?? 'folder'} size={20} color="#FFF" />
            </View>
            <Text style={styles.name}>{item.name}</Text>
            {item.isDefault ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Padrão</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteCategory(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF5252" />
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <CreateCategoryModal
        visible={isCreateModalVisible}
        onSave={handleCreateCategory}
        onClose={() => setIsCreateModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  name: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#888',
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
  },
});
