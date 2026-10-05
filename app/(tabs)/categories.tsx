import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDI } from '../../src/presentation/di/DIContext';
import { Category } from '../../src/domain/entities/category';

export default function CategoriesScreen() {
  const di = useDI();
  const [categories, setCategories] = useState<Category[]>([]);

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

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: item.colorHex }]}>
              <Ionicons name={(item.iconKey as any) ?? 'folder'} size={20} color="#FFF" />
            </View>
            <Text style={styles.name}>{item.name}</Text>
            {item.isDefault && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Padrão</Text>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
});
