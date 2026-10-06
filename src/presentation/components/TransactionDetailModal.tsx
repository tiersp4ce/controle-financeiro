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
import { centsToCurrency, formatPaymentMethod } from '../../core/utils/currency';
import {
  formatDateBr,
  formatDateTimeBr,
  toIsoDateString,
  toMonthKey,
  brDateToIso,
  formatBrDateInput,
} from '../../core/utils/date';
import { AmountInput } from './AmountInput';
import { ActionOptionModal, ActionOption } from './ActionOptionModal';

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
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionModalTitle, setActionModalTitle] = useState('');
  const [actionModalSubtitle, setActionModalSubtitle] = useState('');
  const [actionModalOptions, setActionModalOptions] = useState<ActionOption[]>([]);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmountCents(transaction.amountCents);
      setCategoryId(transaction.categoryId);
      setDateStr(formatDateBr(transaction.date));
      setNotes(transaction.notes || '');
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
        notes: notes.trim() || null,
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

  const handleTogglePaid = async () => {
    try {
      setIsSaving(true);
      const nextIsPaid = !transaction.isPaid;
      await onUpdate({
        ...transaction,
        isPaid: nextIsPaid,
        paidAt: nextIsPaid ? new Date().toISOString() : null,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao atualizar status de pagamento');
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
      setActionModalTitle('Atualizar Parcelamento');
      setActionModalSubtitle('Deseja atualizar a descrição e a categoria em todas as parcelas deste grupo?');
      setActionModalOptions([
        {
          key: 'single',
          label: 'Apenas nesta parcela',
          description: 'Aplica as alterações somente nesta parcela selecionada.',
          onPress: () => performSave('single'),
        },
        {
          key: 'group',
          label: 'Em todas as parcelas',
          description: 'Aplica a nova descrição e categoria a todo o parcelamento.',
          onPress: () => performSave('group'),
        },
        {
          key: 'cancel',
          label: 'Cancelar',
          style: 'cancel',
          onPress: () => {},
        },
      ]);
      setActionModalVisible(true);
      return;
    }

    if (isRecurring && transaction.recurringTransactionId && onUpdateFutureRecurring) {
      setActionModalTitle('Atualizar Transação Recorrente');
      setActionModalSubtitle('Deseja aplicar as alterações apenas neste mês ou atualizar a regra para os próximos meses?');
      setActionModalOptions([
        {
          key: 'single',
          label: 'Apenas neste mês',
          description: 'Modifica somente a ocorrência deste mês.',
          onPress: () => performSave('single'),
        },
        {
          key: 'futureRecurring',
          label: 'Neste e nos próximos meses',
          description: 'Atualiza o valor e as configurações futuras da despesa fixa.',
          onPress: () => performSave('futureRecurring'),
        },
        {
          key: 'cancel',
          label: 'Cancelar',
          style: 'cancel',
          onPress: () => {},
        },
      ]);
      setActionModalVisible(true);
      return;
    }

    await performSave('single');
  };

  const handleAntecipateToToday = async () => {
    const todayIso = toIsoDateString(new Date());
    setActionModalTitle('Antecipar Vencimento da Parcela');
    setActionModalSubtitle(
      `Deseja adiantar o vencimento desta parcela (${transaction.installmentNumber}/${transaction.totalInstallments}) para a fatura aberta do mês atual (${formatDateBr(todayIso)})?\n\nEla permanecerá em aberto para pagamento junto à fatura.`
    );
    setActionModalOptions([
      {
        key: 'confirm',
        label: 'Confirmar Antecipação de Vencimento',
        icon: 'flash-outline',
        onPress: async () => {
          try {
            setIsSaving(true);
            await onUpdate({
              ...transaction,
              date: todayIso,
              invoiceMonth: toMonthKey(todayIso),
              isAnticipated: true,
            });
            onClose();
          } catch (err: any) {
            Alert.alert('Erro', err.message || 'Falha ao antecipar parcela');
          } finally {
            setIsSaving(false);
          }
        },
      },
      {
        key: 'cancel',
        label: 'Cancelar',
        style: 'cancel',
        onPress: () => {},
      },
    ]);
    setActionModalVisible(true);
  };

  const handleDelete = () => {
    if (isInstallment && transaction.installmentGroupId) {
      const options: ActionOption[] = [
        {
          key: 'single',
          label: 'Apenas esta parcela',
          description: 'Exclui unicamente esta parcela selecionada.',
          icon: 'trash-outline',
          style: 'destructive',
          onPress: async () => {
            await onDeleteSingle(transaction.id);
            onClose();
          },
        },
      ];

      if (onDeleteFuture && transaction.installmentNumber) {
        options.push({
          key: 'future',
          label: 'Esta e futuras parcelas',
          description: `Exclui a partir da parcela ${transaction.installmentNumber} até o fim.`,
          icon: 'trash-outline',
          style: 'destructive',
          onPress: async () => {
            await onDeleteFuture(transaction.installmentGroupId!, transaction.installmentNumber!);
            onClose();
          },
        });
      }

      if (onDeleteGroup) {
        options.push({
          key: 'all',
          label: 'Todas as parcelas',
          description: 'Exclui todas as parcelas desta compra.',
          icon: 'trash-outline',
          style: 'destructive',
          onPress: async () => {
            await onDeleteGroup(transaction.installmentGroupId!);
            onClose();
          },
        });
      }

      options.push({
        key: 'cancel',
        label: 'Cancelar',
        style: 'cancel',
        onPress: () => {},
      });

      setActionModalTitle('Excluir Transação Parcelada');
      setActionModalSubtitle(
        `Esta despesa faz parte de uma compra em ${transaction.totalInstallments}x (Parcela ${transaction.installmentNumber}). Como deseja excluir?`
      );
      setActionModalOptions(options);
      setActionModalVisible(true);
    } else if (isRecurring && transaction.recurringTransactionId) {
      const options: ActionOption[] = [
        {
          key: 'skip',
          label: 'Apenas deste mês',
          description: 'Pula ou remove a ocorrência deste mês específico.',
          icon: 'trash-outline',
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
        options.push({
          key: 'end',
          label: 'Encerrar recorrência (deste mês em diante)',
          description: 'Mantém meses passados e desativa as ocorrências futuras.',
          icon: 'stop-circle-outline',
          style: 'destructive',
          onPress: async () => {
            await onEndRecurrence(transaction.recurringTransactionId!, competenceMonth);
            onClose();
          },
        });
      }

      if (onDeleteAllRecurring) {
        options.push({
          key: 'all',
          label: 'Excluir todas as ocorrências',
          description: 'Apaga o histórico completo e a regra desta despesa fixa.',
          icon: 'trash-outline',
          style: 'destructive',
          onPress: async () => {
            await onDeleteAllRecurring(transaction.recurringTransactionId!);
            onClose();
          },
        });
      }

      options.push({
        key: 'cancel',
        label: 'Cancelar',
        style: 'cancel',
        onPress: () => {},
      });

      setActionModalTitle('Excluir Transação Fixa / Recorrente');
      setActionModalSubtitle('Esta transação é uma despesa/receita fixa mensal. Como deseja proceder?');
      setActionModalOptions(options);
      setActionModalVisible(true);
    } else {
      setActionModalTitle('Confirmar Exclusão');
      setActionModalSubtitle(`Deseja realmente excluir a transação "${transaction.description}"?`);
      setActionModalOptions([
        {
          key: 'delete',
          label: 'Sim, Excluir',
          icon: 'trash-outline',
          style: 'destructive',
          onPress: async () => {
            await onDeleteSingle(transaction.id);
            onClose();
          },
        },
        {
          key: 'cancel',
          label: 'Cancelar',
          style: 'cancel',
          onPress: () => {},
        },
      ]);
      setActionModalVisible(true);
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
                    <Text style={styles.infoValue}>{formatPaymentMethod(transaction.paymentMethod)}</Text>
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status de Pagamento</Text>
                    {transaction.isPaid ? (
                      <View style={styles.paidBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        <Text style={styles.paidBadgeText}>
                          {transaction.paidAt ? `Pago em ${formatDateTimeBr(transaction.paidAt)}` : 'Pago'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.unpaidBadge}>
                        <Ionicons name="time-outline" size={14} color="#FFA726" />
                        <Text style={styles.unpaidBadgeText}>Em aberto</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.divider} />

                  {transaction.notes ? (
                    <>
                      <View style={styles.notesBox}>
                        <View style={styles.notesHeader}>
                          <Ionicons name="document-text-outline" size={14} color="#03DAC6" />
                          <Text style={styles.notesLabel}>Anotações:</Text>
                        </View>
                        <Text style={styles.notesText}>{transaction.notes}</Text>
                      </View>
                      <View style={styles.divider} />
                    </>
                  ) : null}

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

                {/* BOTÕES DE QUITAÇÃO DA DESPESA / PARCELA */}
                {!transaction.isPaid ? (
                  <TouchableOpacity
                    style={styles.payNowButton}
                    onPress={handleTogglePaid}
                    disabled={isSaving}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                    <Text style={styles.payNowButtonText}>
                      {isInstallment ? '✓ Quitar Parcela Agora' : '✓ Quitar Despesa Agora'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.unpayButton}
                    onPress={handleTogglePaid}
                    disabled={isSaving}
                  >
                    <Ionicons name="arrow-undo-outline" size={16} color="#AAA" />
                    <Text style={styles.unpayButtonText}>Desfazer Quitação (Marcar em Aberto)</Text>
                  </TouchableOpacity>
                )}

                {/* BOTÃO DE ANTECIPAÇÃO DE VENCIMENTO (CASO SEJA PARCELA FUTURA NÃO PAGA) */}
                {isInstallment && !transaction.isPaid && (
                  <TouchableOpacity
                    style={styles.antecipateButton}
                    onPress={handleAntecipateToToday}
                    disabled={isSaving}
                  >
                    <Ionicons name="calendar-outline" size={16} color="#03DAC6" />
                    <Text style={styles.antecipateButtonText}>
                      Antecipar Vencimento para Mês Atual
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

                <Text style={styles.inputLabel}>Anotações / Observações (opcional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ex: comprado na promoção, garantia de 1 ano, etc."
                  placeholderTextColor="#666"
                  multiline
                />

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

      <ActionOptionModal
        visible={actionModalVisible}
        title={actionModalTitle}
        subtitle={actionModalSubtitle}
        options={actionModalOptions}
        onClose={() => setActionModalVisible(false)}
      />
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
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unpaidBadgeText: {
    color: '#FFA726',
    fontSize: 12,
    fontWeight: '600',
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginVertical: 6,
  },
  payNowButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  unpayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginVertical: 6,
  },
  unpayButtonText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  notesBox: {
    paddingVertical: 6,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  notesLabel: {
    color: '#03DAC6',
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: '#171717',
    padding: 10,
    borderRadius: 8,
  },
  notesInput: {
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
});
