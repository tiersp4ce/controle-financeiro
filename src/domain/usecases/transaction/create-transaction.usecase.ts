import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { IRecurringTransactionRepository } from '../../repositories/recurring-transaction.repository';
import { Transaction } from '../../entities/transaction';
import { PaymentMethod, RecurrenceFrequency, TransactionType } from '../../enums';
import { calculateInvoiceCycle } from '../../../core/utils/credit-card-cycle';
import { toMonthKey } from '../../../core/utils/date';

export interface CreateTransactionInput {
  description: string;
  amountCents: number;
  type: TransactionType;
  date: string; // ISO YYYY-MM-DD
  categoryId: string;
  paymentMethod: PaymentMethod;
  recurrence?: RecurrenceFrequency;
}

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly settingsRepository?: ISettingsRepository,
    private readonly recurringRepository?: IRecurringTransactionRepository
  ) {}

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    if (input.amountCents <= 0) {
      throw new Error('Valor da transação deve ser maior que zero.');
    }
    if (!input.description.trim()) {
      throw new Error('Descrição é obrigatória.');
    }

    let purchaseDate: string | null = input.date;
    let invoiceMonth: string | null = toMonthKey(input.date);
    let effectiveDate: string = input.date;

    if (input.type === TransactionType.EXPENSE && input.paymentMethod === PaymentMethod.CREDIT_CARD && this.settingsRepository) {
      const cardConfig = await this.settingsRepository.getCreditCardConfig();
      if (cardConfig && cardConfig.isEnabled) {
        const cycle = calculateInvoiceCycle(input.date, cardConfig.closingDay, cardConfig.dueDay);
        invoiceMonth = cycle.invoiceMonth;
        effectiveDate = cycle.dueDate;
      }
    }

    let recurringTransactionId: string | null = null;
    if (input.recurrence === RecurrenceFrequency.MONTHLY && this.recurringRepository) {
      const dayOfMonth = parseInt(input.date.split('-')[2], 10) || 1;
      const recurring = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        description: input.description.trim(),
        amountCents: input.amountCents,
        type: input.type,
        dayOfMonth,
        categoryId: input.categoryId,
        paymentMethod: input.paymentMethod,
        startDate: input.date,
        endDate: null,
        skippedMonths: [],
        isActive: true,
        createdAt: Date.now(),
      };
      await this.recurringRepository.create(recurring);
      recurringTransactionId = recurring.id;
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      description: input.description.trim(),
      amountCents: input.amountCents,
      type: input.type,
      date: effectiveDate,
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod,
      recurrence: input.recurrence ?? RecurrenceFrequency.NONE,
      purchaseDate,
      invoiceMonth,
      isPaid: false,
      isAnticipated: false,
      recurringTransactionId,
      createdAt: Date.now(),
    };

    await this.transactionRepository.create(transaction);
    return transaction;
  }
}
