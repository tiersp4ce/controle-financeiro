import { IRecurringTransactionRepository } from '../../repositories/recurring-transaction.repository';
import { RecurringTransaction } from '../../entities/recurring-transaction';
import { PaymentMethod, TransactionType } from '../../enums';
import { EnsureRecurringTransactionsUseCase } from './ensure-recurring-transactions.usecase';
import { toIsoDateString, toMonthKey } from '../../../core/utils/date';

export interface CreateRecurringTransactionInput {
  description: string;
  amountCents: number;
  type: TransactionType;
  dayOfMonth: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
  startDate?: string;
  endDate?: string | null;
}

export class CreateRecurringTransactionUseCase {
  constructor(
    private readonly recurringRepo: IRecurringTransactionRepository,
    private readonly ensureRecurringUseCase?: EnsureRecurringTransactionsUseCase
  ) {}

  async execute(input: CreateRecurringTransactionInput): Promise<RecurringTransaction> {
    if (input.amountCents <= 0) {
      throw new Error('Valor da recorrência deve ser maior que zero.');
    }
    if (!input.description.trim()) {
      throw new Error('Descrição é obrigatória.');
    }
    if (input.dayOfMonth < 1 || input.dayOfMonth > 31) {
      throw new Error('Dia do mês deve estar entre 1 e 31.');
    }

    const startDate = input.startDate ?? toIsoDateString(new Date());

    const recurring: RecurringTransaction = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      description: input.description.trim(),
      amountCents: input.amountCents,
      type: input.type,
      dayOfMonth: input.dayOfMonth,
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod,
      startDate,
      endDate: input.endDate ?? null,
      skippedMonths: [],
      isActive: true,
      createdAt: Date.now(),
    };

    await this.recurringRepo.create(recurring);

    if (this.ensureRecurringUseCase) {
      await this.ensureRecurringUseCase.execute(toMonthKey(startDate));
    }

    return recurring;
  }
}
