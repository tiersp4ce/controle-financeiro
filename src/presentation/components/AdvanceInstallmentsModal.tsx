import React, { useMemo, useState } from 'react';
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
import { formatDateBr, formatMonthYearBr, toIsoDateString } from '../../core/utils/date';

/**
 * Representa um agrupamento de parcelas futuras por mês de fatura.
 */
export interface MonthGroupedInstallments {
  monthKey: string;          // Ex: "2026-11"
  monthLabel: string;        // Ex: "Novembro de 2026"
  totalAmountCents: number;
  installments: Transaction[];
}

interface AdvanceInstallmentsModalProps {
  visible: boolean;
  futureInstallments: Transaction[];
  targetInvoiceMonth: string;
  onAdvance: (selectedIds: string[], targetDate: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal didático de antecipação de parcelas futuras do cartão de crédito.
 *
 * Permite ao usuário filtrar as parcelas futuras mês a mês através de chips/abas
 * horizontais, facilitando a decisão financeira (ex: adiantar apenas as compras de um
 * mês específico com excedente de renda ou 13º salário).
 *
 * Preserva seleção múltipla individual ou em lote, com recálculo transparente em centavos.
 */
export const AdvanceInstallmentsModal: React.FC<AdvanceInstallmentsModalProps> = ({
  visible,
  futureInstallments,
  targetInvoiceMonth,
  onAdvance,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('ALL'); // 'ALL' ou 'YYYY-MM'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Agrupa as parcelas futuras por mês de competência/fatura (YYYY-MM)
  const monthGroups = useMemo<MonthGroupedInstallments[]>(() => {
    const map = new Map<string, Transaction[]>();

    for (const item of futureInstallments) {
      const key = item.invoiceMonth || item.date.substring(0, 7);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }

    const sortedKeys = Array.from(map.keys()).sort();

    return sortedKeys.map((key) => {
      const items = map.get(key)!;
      const totalAmountCents = items.reduce((acc, curr) => acc + curr.amountCents, 0);
      return {
        monthKey: key,
        monthLabel: formatMonthYearBr(key),
        totalAmountCents,
        installments: items,
      };
    });
  }, [futureInstallments]);

  // Itens atualmente visíveis de acordo com a aba/chip selecionado
  const displayedInstallments = useMemo<Transaction[]>(() => {
    if (activeTab === 'ALL') {
      return futureInstallments;
    }
    const group = monthGroups.find((g) => g.monthKey === activeTab);
    return group ? group.installments : [];
  }, [activeTab, futureInstallments, monthGroups]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Seleciona ou desmarca todos os itens visíveis na tela atual
  const toggleSelectVisible = () => {
    const visibleIds = displayedInstallments.map((t) => t.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.has(id));

    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
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

  const isCurrentTabAllSelected =
    displayedInstallments.length > 0 &&
    displayedInstallments.every((t) => selectedIds.has(t.id));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>Antecipar Parcelas Futuras</Text>
              <Text style={styles.subtitle}>
                Puxe parcelas dos próximos meses para a fatura atual ({targetInvoiceMonth}).
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Abas / Chips de Navegação por Mês */}
          {futureInstallments.length > 0 && (
            <View style={styles.chipsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollContainer}
              >
                <TouchableOpacity
                  style={[styles.chip, activeTab === 'ALL' && styles.chipActive]}
                  onPress={() => setActiveTab('ALL')}
                >
                  <Text style={[styles.chipText, activeTab === 'ALL' && styles.chipTextActive]}>
                    Todos ({futureInstallments.length})
                  </Text>
                </TouchableOpacity>

                {monthGroups.map((group) => {
                  const isActive = activeTab === group.monthKey;
                  const [year, month] = group.monthKey.split('-');
                  const shortLabel = `${month}/${year.slice(2)}`;
                  const selectedInGroup = group.installments.filter((t) => selectedIds.has(t.id)).length;

                  return (
                    <TouchableOpacity
                      key={group.monthKey}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => setActiveTab(group.monthKey)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {shortLabel} ({group.installments.length})
                      </Text>
                      {selectedInGroup > 0 && (
                        <View style={styles.chipSelectedDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Barra de Ação em Lote (Selecionar Visíveis) */}
          {displayedInstallments.length > 0 && (
            <View style={styles.batchActionRow}>
              <Text style={styles.batchInfoText}>
                {activeTab === 'ALL'
                  ? 'Exibindo todas as parcelas futuras'
                  : `Fatura de ${monthGroups.find((g) => g.monthKey === activeTab)?.monthLabel ?? activeTab}`}
              </Text>
              <TouchableOpacity onPress={toggleSelectVisible}>
                <Text style={styles.selectAllText}>
                  {isCurrentTabAllSelected ? 'Desmarcar Mês' : 'Marcar Todos'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lista de Parcelas */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {futureInstallments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={44} color="#4CAF50" />
                <Text style={styles.emptyText}>Não há parcelas futuras para antecipar.</Text>
              </View>
            ) : displayedInstallments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="information-circle-outline" size={40} color="#888" />
                <Text style={styles.emptyText}>Nenhuma parcela encontrada para este mês.</Text>
              </View>
            ) : (
              displayedInstallments.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                    onPress={() => toggleSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.description}</Text>
                      <Text style={styles.itemDate}>
                        Previsto: {formatDateBr(item.date)} • Fatura: {item.invoiceMonth || item.date.substring(0, 7)}
                      </Text>
                    </View>
                    <Text style={styles.itemAmount}>{centsToCurrency(item.amountCents)}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Barra de Resumo de Antecipação */}
          {selectedIds.size > 0 && (
            <View style={styles.summaryBar}>
              <View>
                <Text style={styles.summaryLabel}>Total selecionado ({selectedIds.size}):</Text>
                <Text style={styles.summaryHint}>Será debitado na fatura atual</Text>
              </View>
              <Text style={styles.summaryValue}>{centsToCurrency(selectedTotalCents)}</Text>
            </View>
          )}

          {/* Botões de Ação */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}
            >
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
    maxHeight: '88%',
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
  headerTitleContainer: {
    flex: 1,
    marginRight: 8,
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
  },
  closeBtn: {
    padding: 4,
  },
  chipsWrapper: {
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  chipsScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#383838',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#03DAC622',
    borderColor: '#03DAC6',
  },
  chipText: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#03DAC6',
    fontWeight: 'bold',
  },
  chipSelectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#03DAC6',
  },
  batchActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  batchInfoText: {
    color: '#888',
    fontSize: 12,
  },
  selectAllText: {
    color: '#03DAC6',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    maxHeight: 300,
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
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },
  summaryLabel: {
    color: '#AAA',
    fontSize: 12,
  },
  summaryHint: {
    color: '#666',
    fontSize: 10,
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
