import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDI } from '../../src/presentation/di/DIContext';
import { PaymentMethod, RecurrenceFrequency, TransactionType } from '../../src/domain/enums';
import { Category } from '../../src/domain/entities/category';
import { CreditCardConfig } from '../../src/domain/entities/credit-card-config';
import { toIsoDateString, formatDateBr, brDateToIso, formatBrDateInput } from '../../src/core/utils/date';
import { calculateInvoiceCycle } from '../../src/core/utils/credit-card-cycle';
import { centsToCurrency } from '../../src/core/utils/currency';
import { AmountInput } from '../../src/presentation/components/AmountInput';
import { InstallmentDateMode } from '../../src/domain/usecases/transaction/create-installment-transaction.usecase';

export default function NewTransactionScreen() {
  const router = useRouter();
  const di = useDI();

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [description, setDescription] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [dateStr, setDateStr] = useState(() => formatDateBr(toIsoDateString(new Date())));
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);

  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(12);
  const [hasStartedBefore, setHasStartedBefore] = useState(false);
  const [startInstallment, setStartInstallment] = useState('5');
  const [dateMode, setDateMode] = useState<InstallmentDateMode>('FIRST_INSTALLMENT');
  const [notes, setNotes] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [cardConfig, setCardConfig] = useState<CreditCardConfig | null>(null);

  useEffect(() => {
    Promise.all([
      di.getCategories.execute(),
      di.getCreditCardConfig.execute(),
    ]).then(([cats, card]) => {
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
      setCardConfig(card);
    });
  }, [di]);

  const handleDateChange = (text: string) => {
    setDateStr(formatBrDateInput(text));
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

    try {
      if (isInstallment && type === TransactionType.EXPENSE) {
        const startFromNum = hasStartedBefore ? parseInt(startInstallment, 10) : 1;
        if (hasStartedBefore && (isNaN(startFromNum) || startFromNum < 1 || startFromNum > totalInstallments)) {
          Alert.alert('Atenção', `A parcela inicial deve ser entre 1 e ${totalInstallments}.`);
          return;
        }

        await di.createInstallmentTransaction.execute({
          description: description.trim(),
          totalAmountCents: amountCents,
          type: TransactionType.EXPENSE,
          startDate: isoDate,
          categoryId,
          paymentMethod,
          totalInstallments,
          startInstallmentNumber: startFromNum,
          dateMode: hasStartedBefore ? dateMode : 'FIRST_INSTALLMENT',
          notes: notes.trim() || null,
        });
      } else {
        await di.createTransaction.execute({
          description: description.trim(),
          amountCents,
          type,
          date: isoDate,
          categoryId,
          paymentMethod,
          recurrence: isRecurring ? RecurrenceFrequency.MONTHLY : RecurrenceFrequency.NONE,
          notes: notes.trim() || null,
        });
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao salvar transação.');
    }
  };

  // Previsão do Ciclo do Cartão de Crédito
  const isoDateForCalc = brDateToIso(dateStr);
  const cardCycleInfo =
    paymentMethod === PaymentMethod.CREDIT_CARD && cardConfig && cardConfig.isEnabled && isoDateForCalc
      ? calculateInvoiceCycle(isoDateForCalc, cardConfig.closingDay, cardConfig.dueDay)
      : null;

  // Cálculos da prévia de parcelamento
  const startNum = hasStartedBefore ? Math.max(1, Math.min(parseInt(startInstallment, 10) || 1, totalInstallments)) : 1;
  const approxInstallmentCents = totalInstallments > 0 ? Math.floor(amountCents / totalInstallments) : 0;
  const remainingCount = totalInstallments - startNum + 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tipo: Despesa ou Receita */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === TransactionType.EXPENSE && styles.expenseActive,
          ]}
          onPress={() => setType(TransactionType.EXPENSE)}
        >
          <Text style={styles.typeText}>Despesa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            type === TransactionType.INCOME && styles.incomeActive,
          ]}
          onPress={() => {
            setType(TransactionType.INCOME);
            setIsInstallment(false);
          }}
        >
          <Text style={styles.typeText}>Receita</Text>
        </TouchableOpacity>
      </View>

      {/* Input de Valor em Centavos */}
      <AmountInput
        cents={amountCents}
        onChangeCents={setAmountCents}
        type={type}
      />

      {/* Descrição */}
      <Text style={styles.fieldLabel}>Descrição</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Ex: Aluguel, Supermercado, Freelance, Assinatura"
        placeholderTextColor="#666"
        value={description}
        onChangeText={setDescription}
      />

      {/* Data */}
      <Text style={styles.fieldLabel}>Data da Transação (DD/MM/AAAA)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="DD/MM/AAAA"
        placeholderTextColor="#666"
        keyboardType="numeric"
        maxLength={10}
        value={dateStr}
        onChangeText={handleDateChange}
      />

      {/* Categoria */}
      <Text style={styles.fieldLabel}>Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {categories.map((cat) => {
          const selected = cat.id === categoryId;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                selected && { backgroundColor: cat.colorHex, borderColor: cat.colorHex },
              ]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text style={[styles.chipText, selected && { color: '#FFF', fontWeight: 'bold' }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Forma de Pagamento */}
      <Text style={styles.fieldLabel}>Forma de Pagamento</Text>
      <View style={styles.paymentMethodsRow}>
        {[
          { key: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito', icon: 'card-outline' },
          { key: PaymentMethod.PIX, label: 'PIX', icon: 'flash-outline' },
          { key: PaymentMethod.DEBIT_CARD, label: 'Débito', icon: 'wallet-outline' },
          { key: PaymentMethod.CASH, label: 'Dinheiro', icon: 'cash-outline' },
          { key: PaymentMethod.BANK_SLIP, label: 'Boleto', icon: 'document-text-outline' },
        ].map((pm) => (
          <TouchableOpacity
            key={pm.key}
            style={[
              styles.pmChip,
              paymentMethod === pm.key && styles.pmChipActive,
            ]}
            onPress={() => setPaymentMethod(pm.key)}
          >
            <Ionicons
              name={pm.icon as any}
              size={14}
              color={paymentMethod === pm.key ? '#FFF' : '#888'}
            />
            <Text
              style={[
                styles.pmChipText,
                paymentMethod === pm.key && styles.pmChipTextActive,
              ]}
            >
              {pm.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback do Ciclo de Fatura do Cartão */}
      {cardCycleInfo && (
        <View
          style={[
            styles.invoiceFeedbackBox,
            cardCycleInfo.isAfterClosing && styles.invoiceFeedbackBestDay,
          ]}
        >
          <Ionicons
            name={cardCycleInfo.isAfterClosing ? 'sparkles' : 'calendar'}
            size={16}
            color={cardCycleInfo.isAfterClosing ? '#FFA726' : '#03DAC6'}
          />
          <View style={styles.invoiceFeedbackContent}>
            <Text style={styles.invoiceFeedbackTitle}>
              {cardCycleInfo.isAfterClosing
                ? '⚡ Melhor dia de compra (após fechamento)!'
                : '📅 Compra antes do fechamento'}
            </Text>
            <Text style={styles.invoiceFeedbackText}>
              Entrará na fatura de {cardCycleInfo.invoiceMonth} com vencimento em{' '}
              {formatDateBr(cardCycleInfo.dueDate)}.
            </Text>
          </View>
        </View>
      )}

      {/* Opção: Despesa / Receita Fixa Recorrente */}
      {!isInstallment && (
        <View style={styles.recurringContainer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
              {isRecurring && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>
                {type === TransactionType.EXPENSE ? 'Despesa Fixa Mensal (Recorrente)' : 'Receita Fixa Mensal (Recorrente)'}
              </Text>
              <Text style={styles.subCheckboxLabel}>
                Será gerada automaticamente todo mês com vencimento no dia {dateStr.substring(0, 2)}.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Compra Parcelada (somente despesa e quando não recorrente) */}
      {type === TransactionType.EXPENSE && !isRecurring && (
        <View style={styles.installmentContainer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsInstallment(!isInstallment)}
          >
            <View style={[styles.checkbox, isInstallment && styles.checkboxChecked]}>
              {isInstallment && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Compra Parcelada (Cartão/Carnê)</Text>
          </TouchableOpacity>

          {isInstallment && (
            <View style={styles.installmentDetailsBox}>
              <View style={styles.installmentPickerRow}>
                <Text style={styles.fieldLabel}>Total de Parcelas da Compra:</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setTotalInstallments(Math.max(2, totalInstallments - 1))}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{totalInstallments}x</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setTotalInstallments(totalInstallments + 1)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Opção: Já paguei parcelas anteriores */}
              <TouchableOpacity
                style={[styles.checkboxRow, { marginTop: 14 }]}
                onPress={() => setHasStartedBefore(!hasStartedBefore)}
              >
                <View style={[styles.checkbox, hasStartedBefore && styles.checkboxChecked]}>
                  {hasStartedBefore && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={styles.subCheckboxLabel}>
                  Já estou pagando (começar de uma parcela específica)
                </Text>
              </TouchableOpacity>

              {hasStartedBefore && (
                <View style={styles.retroactiveConfigBox}>
                  <View style={styles.startInstallmentRow}>
                    <Text style={styles.startInstallmentLabel}>
                      Começar a partir da parcela:
                    </Text>
                    <TextInput
                      style={styles.startInstallmentInput}
                      keyboardType="numeric"
                      maxLength={2}
                      value={startInstallment}
                      onChangeText={(t) => setStartInstallment(t.replace(/\D/g, ''))}
                      placeholder="Ex: 5"
                      placeholderTextColor="#666"
                    />
                    <Text style={styles.startInstallmentSuffix}>de {totalInstallments}</Text>
                  </View>

                  <Text style={styles.dateModeLabel}>A data informada no formulário é a:</Text>
                  <View style={styles.dateModeSelectorRow}>
                    <TouchableOpacity
                      style={[
                        styles.dateModeOption,
                        dateMode === 'PURCHASE_DATE' && styles.dateModeOptionActive,
                      ]}
                      onPress={() => setDateMode('PURCHASE_DATE')}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={dateMode === 'PURCHASE_DATE' ? '#03DAC6' : '#888'}
                      />
                      <Text
                        style={[
                          styles.dateModeOptionText,
                          dateMode === 'PURCHASE_DATE' && styles.dateModeOptionTextActive,
                        ]}
                      >
                        Data da Compra Original
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.dateModeOption,
                        dateMode === 'FIRST_INSTALLMENT' && styles.dateModeOptionActive,
                      ]}
                      onPress={() => setDateMode('FIRST_INSTALLMENT')}
                    >
                      <Ionicons
                        name="wallet-outline"
                        size={14}
                        color={dateMode === 'FIRST_INSTALLMENT' ? '#03DAC6' : '#888'}
                      />
                      <Text
                        style={[
                          styles.dateModeOptionText,
                          dateMode === 'FIRST_INSTALLMENT' && styles.dateModeOptionTextActive,
                        ]}
                      >
                        Data da 1ª Parcela a Pagar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Prévia do cálculo */}
              {amountCents > 0 && (
                <View style={styles.previewBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#03DAC6" />
                  <Text style={styles.previewText}>
                    {hasStartedBefore
                      ? dateMode === 'PURCHASE_DATE'
                        ? `Compra original em ${dateStr}. Serão lançadas ${remainingCount} parcelas restantes (${startNum}/${totalInstallments} até ${totalInstallments}/${totalInstallments}) de ~${centsToCurrency(approxInstallmentCents)}, com a parcela ${startNum} calculada ${startNum - 1} meses após a data da compra.`
                        : `Serão lançadas ${remainingCount} parcelas restantes (${startNum}/${totalInstallments} até ${totalInstallments}/${totalInstallments}) de ~${centsToCurrency(approxInstallmentCents)} iniciando em ${dateStr}.`
                      : `Serão lançadas ${totalInstallments} parcelas de ~${centsToCurrency(approxInstallmentCents)} de ${dateStr} em diante.`}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Anotações / Observações */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Anotações / Observações (opcional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Ex: comprado na promoção, dividir com João, etc."
          placeholderTextColor="#666"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      {/* Botão Salvar */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Salvar Transação</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  expenseActive: {
    backgroundColor: '#FF5252',
  },
  incomeActive: {
    backgroundColor: '#4CAF50',
  },
  typeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  fieldLabel: {
    color: '#888',
    fontSize: 13,
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    fontSize: 15,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  chipText: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '500',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  pmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  pmChipActive: {
    backgroundColor: '#333',
    borderColor: '#03DAC6',
  },
  pmChipText: {
    color: '#888',
    fontSize: 12,
  },
  pmChipTextActive: {
    color: '#03DAC6',
    fontWeight: '600',
  },
  invoiceFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#132222',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#03DAC644',
    marginVertical: 8,
    gap: 10,
  },
  invoiceFeedbackBestDay: {
    backgroundColor: '#241D12',
    borderColor: '#FFA72666',
  },
  invoiceFeedbackContent: {
    flex: 1,
  },
  invoiceFeedbackTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  invoiceFeedbackText: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 2,
  },
  recurringContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  installmentContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6200EE',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6200EE',
  },
  checkboxLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subCheckboxLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  installmentDetailsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },
  installmentPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepperValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retroactiveConfigBox: {
    marginTop: 10,
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 10,
  },
  dateModeLabel: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  dateModeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
  },
  dateModeOptionActive: {
    backgroundColor: '#162828',
    borderColor: '#03DAC6',
  },
  dateModeOptionText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
  },
  dateModeOptionTextActive: {
    color: '#03DAC6',
    fontWeight: 'bold',
  },
  startInstallmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  startInstallmentLabel: {
    color: '#AAA',
    fontSize: 13,
  },
  startInstallmentInput: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#444',
    textAlign: 'center',
    width: 48,
  },
  startInstallmentSuffix: {
    color: '#AAA',
    fontSize: 13,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#142222',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#03DAC633',
  },
  previewText: {
    flex: 1,
    color: '#03DAC6',
    fontSize: 12,
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesInput: {
    height: 64,
    textAlignVertical: 'top',
  },
});
