import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../domain/entities/transaction';
import { centsToCurrency } from '../../core/utils/currency';
import { formatDateBr, toIsoDateString } from '../../core/utils/date';

interface AdvanceInstallmentsModalProps {
  visible: boolean;
  futureInstallments: Transaction[];
  targetInvoiceMonth: string;
  onAdvance: (selectedIds: string[], targetDate: string) => Promise<void>;
  onClose: () => void;
}

export const AdvanceInstallmentsModal: React.FC<AdvanceInstallmentsModalProps> = ({
  visible,
  futureInstallments,
  targetInvoiceMonth,
  onAdvance,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === futureInstallments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(futureInstallments.map((t) => t.id)));
    }
  };

  const selectedTotalCents = futureInstallments
    .filter((t) => selectedIds.has(t.id))
    .reduce((acc, curr) => acc + curr.amountCents, 0);

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos uma parcela para antecipar.');
      return;
    }

    try {
      setIsSubmitting(true);
      const todayIso = toIsoDateString(new Date());
      await onAdvance(Array.from(selectedIds), todayIso);
      setSelectedIds(new Set());
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao antecipar parcelas');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Antecipar Parcelas Futuras</Text>
              <Text style={styles.subtitle}>
                Puxe parcelas dos próximos meses para a fatura atual ({targetInvoiceMonth}).
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {futureInstallments.length > 0 && (
            <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
              <Text style={styles.selectAllText}>
                {selectedIds.size === futureInstallments.length
                  ? 'Desmarcar Todas'
                  : 'Selecionar Todas'}
              </Text>
            </TouchableOpacity>
          )}

          <ScrollView style={styles.list}>
            {futureInstallments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={44} color="#4CAF50" />
                <Text style={styles.emptyText}>Não há parcelas futuras para antecipar.</Text>
              </View>
            ) : (
              futureInstallments.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                    onPress={() => toggleSelect(item.id)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.description}</Text>
                      <Text style={styles.itemDate}>
                        Previsto: {formatDateBr(item.date)} • Fatura {item.invoiceMonth}
                      </Text>
                    </View>
                    <Text style={styles.itemAmount}>{centsToCurrency(item.amountCents)}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {selectedIds.size > 0 && (
            <View style={styles.summaryBar}>
              <Text style={styles.summaryLabel}>Total selecionado ({selectedIds.size}):</Text>
              <Text style={styles.summaryValue}>{centsToCurrency(selectedTotalCents)}</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, selectedIds.size === 0 && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={isSubmitting || selectedIds.size === 0}
            >
              <Text style={styles.confirmButtonText}>
                {isSubmitting ? 'Antecipando...' : `Antecipar (${selectedIds.size})`}
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
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  title: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    maxWidth: 240,
  },
  closeBtn: {
    padding: 4,
  },
  selectAllBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectAllText: {
    color: '#03DAC6',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    maxHeight: 320,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemCardSelected: {
    borderColor: '#03DAC6',
    backgroundColor: '#1A2E2E',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#03DAC6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#03DAC6',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  itemDate: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  itemAmount: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161616',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },
  summaryLabel: {
    color: '#AAA',
    fontSize: 13,
  },
  summaryValue: {
    color: '#03DAC6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
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
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6200EE',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
