import React, { useEffect, useState } from 'react';
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
import { Transaction } from '../../domain/entities/transaction';
import { Category } from '../../domain/entities/category';
import { PaymentMethod, TransactionType } from '../../domain/enums';
import { centsToCurrency } from '../../core/utils/currency';
import {
  formatDateBr,
  toIsoDateString,
  toMonthKey,
  brDateToIso,
  formatBrDateInput,
} from '../../core/utils/date';
import { AmountInput } from './AmountInput';

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  category?: Category;
  allCategories: Category[];
  onClose: () => void;
  onUpdate: (updated: Transaction) => Promise<void>;
  onUpdateGroup?: (groupId: string, description?: string, categoryId?: string) => Promise<void>;
  onUpdateFutureRecurring?: (
    recurringId: string,
    fromMonthKey: string,
    description?: string,
    amountCents?: number,
    categoryId?: string,
    dayOfMonth?: number,
    paymentMethod?: PaymentMethod
  ) => Promise<void>;
  onDeleteSingle: (id: string) => Promise<void>;
  onDeleteGroup?: (groupId: string) => Promise<void>;
  onDeleteFuture?: (groupId: string, fromInstallmentNumber: number) => Promise<void>;
  onSkipRecurringMonth?: (recurringId: string, monthKey: string) => Promise<void>;
  onEndRecurrence?: (recurringId: string, endMonthKey: string) => Promise<void>;
  onDeleteAllRecurring?: (recurringId: string) => Promise<void>;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  transaction,
  category,
  allCategories,
  onClose,
  onUpdate,
  onUpdateGroup,
  onUpdateFutureRecurring,
  onDeleteSingle,
  onDeleteGroup,
  onDeleteFuture,
  onSkipRecurringMonth,
  onEndRecurrence,
  onDeleteAllRecurring,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmountCents(transaction.amountCents);
      setCategoryId(transaction.categoryId);
      setDateStr(formatDateBr(transaction.date));
      setIsEditing(false);
    }
  }, [transaction, visible]);

  if (!transaction) return null;

  const isIncome = transaction.type === TransactionType.INCOME;
  const currentCat =
    allCategories.find((c) => c.id === (isEditing ? categoryId : transaction.categoryId)) ||
    category;
  const isInstallment = Boolean(
    transaction.installmentGroupId &&
      transaction.totalInstallments &&
      transaction.totalInstallments > 1
  );
  const isRecurring = Boolean(transaction.recurringTransactionId);
  const competenceMonth = toMonthKey(transaction.purchaseDate ?? transaction.date);

  const performSave = async (updateMode: 'single' | 'group' | 'futureRecurring') => {
    const isoDate = brDateToIso(dateStr);
    if (!isoDate) {
      Alert.alert('Atenção', 'Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate({
        ...transaction,
        description: description.trim(),
        amountCents,
        categoryId,
        date: isoDate,
      });

      if (updateMode === 'group' && transaction.installmentGroupId && onUpdateGroup) {
        await onUpdateGroup(transaction.installmentGroupId, description.trim(), categoryId);
      } else if (
        updateMode === 'futureRecurring' &&
        transaction.recurringTransactionId &&
        onUpdateFutureRecurring
      ) {
        const dayOfMonth = parseInt(isoDate.split('-')[2], 10) || 1;
        await onUpdateFutureRecurring(
          transaction.recurringTransactionId,
          competenceMonth,
          description.trim(),
          amountCents,
          categoryId,
          dayOfMonth,
          transaction.paymentMethod
        );
      }

      setIsEditing(false);
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao atualizar transação');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (amountCents <= 0) {
      Alert.alert('Atenção', 'Informe um valor maior que zero.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Atenção', 'Informe a descrição da transação.');
      return;
    }

    const isoDate = brDateToIso(dateStr);
    if (!isoDate) {
      Alert.alert('Atenção', 'Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    if (
      isInstallment &&
      transaction.installmentGroupId &&
      onUpdateGroup &&
      (description.trim() !== transaction.description || categoryId !== transaction.categoryId)
    ) {
      Alert.alert(
        'Atualizar Parcelamento',
        'Deseja atualizar a descrição e a categoria em todas as parcelas deste grupo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Apenas nesta parcela',
            onPress: () => performSave('single'),
          },
          {
            text: 'Em todas as parcelas',
            onPress: () => performSave('group'),
          },
        ]
      );
      return;
    }

    if (isRecurring && transaction.recurringTransactionId && onUpdateFutureRecurring) {
      Alert.alert(
        'Atualizar Transação Recorrente',
        'Deseja aplicar as alterações apenas neste mês ou atualizar o valor/regra para os próximos meses?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Apenas neste mês',
            onPress: () => performSave('single'),
          },
          {
            text: 'Neste e nos próximos meses',
            onPress: () => performSave('futureRecurring'),
          },
        ]
      );
      return;
    }

    await performSave('single');
  };

  const handleAntecipateToToday = async () => {
    const todayIso = toIsoDateString(new Date());
    Alert.alert(
      'Antecipar / Amortizar Parcela',
      `Deseja adiantar o vencimento desta parcela (${transaction.installmentNumber}/${transaction.totalInstallments}) para hoje (${formatDateBr(todayIso)})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Antecipação',
          onPress: async () => {
            try {
              setIsSaving(true);
              await onUpdate({
                ...transaction,
                date: todayIso,
              });
              onClose();
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao antecipar parcela');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (isInstallment && transaction.installmentGroupId) {
      const alertButtons: any[] = [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Apenas esta parcela',
          style: 'destructive',
          onPress: async () => {
            await onDeleteSingle(transaction.id);
            onClose();
          },
        },
      ];

      if (onDeleteFuture && transaction.installmentNumber) {
        alertButtons.push({
          text: 'Esta e futuras',
          style: 'destructive',
          onPress: async () => {
            await onDeleteFuture(transaction.installmentGroupId!, transaction.installmentNumber!);
            onClose();
          },
        });
      }

      if (onDeleteGroup) {
        alertButtons.push({
          text: 'Todas as parcelas',
          style: 'destructive',
          onPress: async () => {
            await onDeleteGroup(transaction.installmentGroupId!);
            onClose();
          },
        });
      }

      Alert.alert(
        'Excluir Transação Parcelada',
        `Esta despesa faz parte de uma compra em ${transaction.totalInstallments}x (Parcela ${transaction.installmentNumber}). Como deseja excluir?`,
        alertButtons
      );
    } else if (isRecurring && transaction.recurringTransactionId) {
      const alertButtons: any[] = [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Apenas deste mês',
          style: 'destructive',
          onPress: async () => {
            if (onSkipRecurringMonth) {
              await onSkipRecurringMonth(transaction.recurringTransactionId!, competenceMonth);
            } else {
              await onDeleteSingle(transaction.id);
            }
            onClose();
          },
        },
      ];

      if (onEndRecurrence) {
        alertButtons.push({
          text: 'Encerrar recorrência (deste mês em diante)',
          style: 'destructive',
          onPress: async () => {
            await onEndRecurrence(transaction.recurringTransactionId!, competenceMonth);
            onClose();
          },
        });
      }

      if (onDeleteAllRecurring) {
        alertButtons.push({
          text: 'Excluir todas as ocorrências',
          style: 'destructive',
          onPress: async () => {
            await onDeleteAllRecurring(transaction.recurringTransactionId!);
            onClose();
          },
        });
      }

      Alert.alert(
        'Excluir Transação Fixa / Recorrente',
        `Esta transação é uma despesa/receita fixa mensal. Como deseja proceder?`,
        alertButtons
      );
    } else {
      Alert.alert(
        'Confirmar Exclusão',
        `Deseja realmente excluir a transação "${transaction.description}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              await onDeleteSingle(transaction.id);
              onClose();
            },
          },
        ]
      );
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
            <Text style={styles.headerTitle}>
              {isEditing ? 'Editar Transação' : 'Detalhes da Transação'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {!isEditing ? (
              /* MODO VISUALIZAÇÃO */
              <View>
                <View style={styles.amountDisplayCard}>
                  <View
                    style={[
                      styles.catIconBubble,
                      { backgroundColor: currentCat?.colorHex ?? '#444' },
                    ]}
                  >
                    <Ionicons
                      name={(currentCat?.iconKey as any) ?? 'card'}
                      size={26}
                      color="#FFF"
                    />
                  </View>
                  <Text
                    style={[
                      styles.amountValue,
                      { color: isIncome ? '#4CAF50' : '#FF5252' },
                    ]}
                  >
                    {isIncome ? '+' : '-'} {centsToCurrency(transaction.amountCents)}
                  </Text>
                  <Text style={styles.descTitle}>{transaction.description}</Text>
                </View>

                <View style={styles.infoList}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Categoria</Text>
                    <Text style={styles.infoValue}>{currentCat?.name ?? 'Sem categoria'}</Text>
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Data</Text>
                    <Text style={styles.infoValue}>{formatDateBr(transaction.date)}</Text>
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Forma de Pagamento</Text>
                    <Text style={styles.infoValue}>{transaction.paymentMethod}</Text>
                  </View>
                  <View style={styles.divider} />

                  {isRecurring && (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tipo</Text>
                        <Text style={styles.recurringHighlight}>Fixa / Recorrente Mensal</Text>
                      </View>
                      <View style={styles.divider} />
                    </>
                  )}

                  {transaction.paymentMethod === PaymentMethod.CREDIT_CARD || transaction.invoiceMonth ? (
                    <>
                      {transaction.purchaseDate && transaction.purchaseDate !== transaction.date && (
                        <>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Data da Compra</Text>
                            <Text style={styles.infoValue}>{formatDateBr(transaction.purchaseDate)}</Text>
                          </View>
                          <View style={styles.divider} />
                        </>
                      )}
                      {transaction.invoiceMonth && (
                        <>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Fatura de Cobrança</Text>
                            <Text style={styles.infoValue}>{transaction.invoiceMonth}</Text>
                          </View>
                          <View style={styles.divider} />
                        </>
                      )}
                    </>
                  ) : null}

                  {isInstallment && (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Parcelamento</Text>
                        <Text style={styles.installmentHighlight}>
                          Parcela {transaction.installmentNumber} de {transaction.totalInstallments}
                        </Text>
                      </View>
                      <View style={styles.divider} />
                    </>
                  )}
                </View>

                {/* BOTÃO RÁPIDO DE ANTECIPAÇÃO (CASO SEJA PARCELA FUTURA) */}
                {isInstallment && (
                  <TouchableOpacity
                    style={styles.antecipateButton}
                    onPress={handleAntecipateToToday}
                  >
                    <Ionicons name="flash-outline" size={16} color="#03DAC6" />
                    <Text style={styles.antecipateButtonText}>
                      Antecipar / Quitar no Mês Atual
                    </Text>
                  </TouchableOpacity>
                )}

                {/* AÇÕES: EDITAR / EXCLUIR */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF5252" />
                    <Text style={styles.deleteButtonText}>Excluir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="pencil" size={18} color="#FFF" />
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* MODO EDIÇÃO */
              <View>
                <AmountInput
                  cents={amountCents}
                  onChangeCents={setAmountCents}
                  type={transaction.type}
                />

                <Text style={styles.inputLabel}>Descrição</Text>
                <TextInput
                  style={styles.textInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descrição da transação"
                  placeholderTextColor="#666"
                />

                <Text style={styles.inputLabel}>Data de Pagamento / Vencimento (DD/MM/AAAA)</Text>
                <TextInput
                  style={styles.textInput}
                  value={dateStr}
                  onChangeText={(t) => setDateStr(formatBrDateInput(t))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  maxLength={10}
                />

                <Text style={styles.inputLabel}>Categoria</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipsRow}
                >
                  {allCategories.map((cat) => {
                    const selected = cat.id === categoryId;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.chip,
                          selected && {
                            backgroundColor: cat.colorHex,
                            borderColor: cat.colorHex,
                          },
                        ]}
                        onPress={() => setCategoryId(cat.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && { color: '#FFF', fontWeight: 'bold' },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <Text style={styles.cancelButtonText}>Voltar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={isSaving}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
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
    padding: 18,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  amountDisplayCard: {
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  catIconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  descTitle: {
    color: '#DDD',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  infoList: {
    backgroundColor: '#242424',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  installmentHighlight: {
    color: '#FFA726',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recurringHighlight: {
    color: '#81C784',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#303030',
  },
  antecipateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#142A2A',
    borderWidth: 1,
    borderColor: '#03DAC666',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  antecipateButtonText: {
    color: '#03DAC6',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A1818',
    borderWidth: 1,
    borderColor: '#FF525255',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#FF5252',
    fontSize: 15,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200EE',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#888',
    fontSize: 13,
    marginTop: 14,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#252525',
    color: '#FFF',
    fontSize: 15,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#383838',
    marginRight: 8,
  },
  chipText: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '500',
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
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6200EE',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
