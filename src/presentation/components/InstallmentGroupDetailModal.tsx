import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecentFeedItem } from '../../domain/entities/recent-feed';
import { Category } from '../../domain/entities/category';
import { Transaction } from '../../domain/entities/transaction';
import { centsToCurrency } from '../../core/utils/currency';
import { formatDateBr } from '../../core/utils/date';

type InstallmentGroupFeedItem = Extract<RecentFeedItem, { kind: 'INSTALLMENT_GROUP' }>;

interface InstallmentGroupDetailModalProps {
  visible: boolean;
  groupItem: InstallmentGroupFeedItem | null;
  category?: Category;
  onClose: () => void;
  /**
   * Callback opcional caso o usuário deseje inspecionar ou gerenciar
   * uma parcela específica através do TransactionDetailModal.
   */
  onSelectInstallment?: (transaction: Transaction) => void;
}

/**
 * Modal didático de detalhes de compra parcelada consolidada.
 *
 * Apresenta a visão unificada da compra (valor total, progresso de quitação)
 * e o desdobramento transparente de cada uma das parcelas com vencimento,
 * competência de fatura, valor exato em centavos (inclusive resto na 1ª parcela)
 * e status de liquidação.
 */
export const InstallmentGroupDetailModal: React.FC<InstallmentGroupDetailModalProps> = ({
  visible,
  groupItem,
  category,
  onClose,
  onSelectInstallment,
}) => {
  if (!groupItem) return null;

  const progressPercent =
    groupItem.totalInstallments > 0
      ? Math.round((groupItem.paidInstallmentsCount / groupItem.totalInstallments) * 100)
      : 0;

  const remainingInstallments = groupItem.totalInstallments - groupItem.paidInstallmentsCount;
  const remainingAmountCents = groupItem.allInstallments
    .filter((t) => !t.isPaid)
    .reduce((acc, curr) => acc + curr.amountCents, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Cabeçalho do Modal */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: category?.colorHex ?? '#6200EE' },
                ]}
              >
                <Ionicons
                  name={(category?.iconKey as any) ?? 'card'}
                  size={18}
                  color="#FFF"
                />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title} numberOfLines={1}>
                  {groupItem.description}
                </Text>
                <Text style={styles.subtitle}>
                  Compra parcelada em {formatDateBr(groupItem.purchaseDate)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Card Resumo do Financiamento */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Valor Total da Compra</Text>
                <Text style={styles.summaryTotal}>{centsToCurrency(groupItem.totalAmountCents)}</Text>
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.summaryLabel}>Restante a Pagar</Text>
                <Text style={styles.summaryRemaining}>{centsToCurrency(remainingAmountCents)}</Text>
              </View>
            </View>

            {/* Barra de Progresso de Quitação */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressText}>
                  {groupItem.paidInstallmentsCount} de {groupItem.totalInstallments} parcelas quitadas ({progressPercent}%)
                </Text>
                <Text style={styles.remainingPillsText}>
                  {remainingInstallments > 0 ? `${remainingInstallments} pendente(s)` : '100% Quitado'}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          </View>

          {/* Listagem de Parcelas */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>Desdobramento das Parcelas</Text>
            <Text style={styles.listHeaderBadge}>
              {groupItem.allInstallments.length} parcelas registradas
            </Text>
          </View>

          <ScrollView style={styles.installmentList} showsVerticalScrollIndicator={false}>
            {groupItem.allInstallments.map((tx) => {
              const isPaid = Boolean(tx.isPaid);
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[styles.installmentCard, isPaid && styles.installmentCardPaid]}
                  onPress={() => onSelectInstallment && onSelectInstallment(tx)}
                  activeOpacity={onSelectInstallment ? 0.7 : 1}
                >
                  <View style={styles.installmentLeft}>
                    <View style={[styles.installmentNumberBadge, isPaid ? styles.badgePaid : styles.badgePending]}>
                      <Text style={[styles.installmentNumberText, isPaid ? styles.textPaid : styles.textPending]}>
                        {tx.installmentNumber ?? '•'}/{tx.totalInstallments ?? groupItem.totalInstallments}
                      </Text>
                    </View>
                    <View style={styles.installmentInfoCol}>
                      <Text style={styles.installmentDate}>
                        Vencimento: {formatDateBr(tx.date)}
                      </Text>
                      {tx.invoiceMonth && (
                        <Text style={styles.invoiceMonthText}>
                          Fatura: {tx.invoiceMonth}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.installmentRight}>
                    <Text style={[styles.installmentAmount, isPaid && styles.installmentAmountPaid]}>
                      {centsToCurrency(tx.amountCents)}
                    </Text>
                    <View style={[styles.statusTag, isPaid ? styles.statusTagPaid : styles.statusTagPending]}>
                      <Ionicons
                        name={isPaid ? 'checkmark-circle' : 'time-outline'}
                        size={12}
                        color={isPaid ? '#4CAF50' : '#FF9800'}
                      />
                      <Text style={[styles.statusTagText, { color: isPaid ? '#4CAF50' : '#FF9800' }]}>
                        {isPaid ? 'Pago' : 'Em Aberto'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rodapé com Botão Fechar */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerCloseBtn} onPress={onClose}>
              <Text style={styles.footerCloseBtnText}>Fechar Detalhes</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: '#262626',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    color: '#AAA',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTotal: {
    color: '#FF5252',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryRemaining: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  progressContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    color: '#DDD',
    fontSize: 12,
    fontWeight: '500',
  },
  remainingPillsText: {
    color: '#BB86FC',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#3A3A3A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listHeaderTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listHeaderBadge: {
    color: '#888',
    fontSize: 11,
  },
  installmentList: {
    maxHeight: 280,
  },
  installmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#303030',
  },
  installmentCardPaid: {
    backgroundColor: '#1C241D',
    borderColor: '#263828',
  },
  installmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  installmentNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  badgePaid: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  badgePending: {
    backgroundColor: 'rgba(187, 134, 252, 0.15)',
  },
  installmentNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  textPaid: {
    color: '#4CAF50',
  },
  textPending: {
    color: '#BB86FC',
  },
  installmentInfoCol: {
    flex: 1,
  },
  installmentDate: {
    color: '#EEE',
    fontSize: 13,
    fontWeight: '500',
  },
  invoiceMonthText: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  installmentRight: {
    alignItems: 'flex-end',
  },
  installmentAmount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  installmentAmountPaid: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  statusTagPaid: {},
  statusTagPending: {},
  statusTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    marginTop: 14,
  },
  footerCloseBtn: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerCloseBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
