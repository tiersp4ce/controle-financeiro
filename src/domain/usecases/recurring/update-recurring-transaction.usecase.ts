import { IRecurringTransactionRepository } from '../../repositories/recurring-transaction.repository';
import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { RecurringTransaction } from '../../entities/recurring-transaction';
import { Transaction } from '../../entities/transaction';
import { PaymentMethod } from '../../enums';
import { calculateClampedDate, toMonthKey } from '../../../core/utils/date';
import { calculateInvoiceCycle } from '../../../core/utils/credit-card-cycle';

export interface UpdateRecurringFutureInput {
  recurringId: string;
  fromMonthKey: string;
  description?: string;
  amountCents?: number;
  categoryId?: string;
  dayOfMonth?: number;
  paymentMethod?: PaymentMethod;
}

export class UpdateRecurringTransactionUseCase {
  constructor(
    private readonly recurringRepo: IRecurringTransactionRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly settingsRepo?: ISettingsRepository
  ) {}

  async execute(recurring: RecurringTransaction): Promise<void> {
    if (recurring.amountCents <= 0) {
      throw new Error('Valor da recorrência deve ser maior que zero.');
    }
    if (!recurring.description.trim()) {
      throw new Error('Descrição é obrigatória.');
    }
    if (recurring.dayOfMonth < 1 || recurring.dayOfMonth > 31) {
      throw new Error('Dia do mês deve estar entre 1 e 31.');
    }

    await this.recurringRepo.update(recurring);
  }

  async updateFutureOccurrences(input: UpdateRecurringFutureInput): Promise<void> {
    const existingRule = await this.recurringRepo.findById(input.recurringId);
    if (!existingRule) {
      throw new Error('Regra de recorrência não encontrada.');
    }

    const updatedRule: RecurringTransaction = {
      ...existingRule,
      description: input.description?.trim() ?? existingRule.description,
      amountCents: input.amountCents ?? existingRule.amountCents,
      categoryId: input.categoryId ?? existingRule.categoryId,
      dayOfMonth: input.dayOfMonth ?? existingRule.dayOfMonth,
      paymentMethod: input.paymentMethod ?? existingRule.paymentMethod,
    };

    await this.recurringRepo.update(updatedRule);

    const futureTxs = await this.transactionRepo.findUnpaidFutureByRecurringId(
      input.recurringId,
      input.fromMonthKey
    );

    if (futureTxs.length === 0) {
      return;
    }

    const cardConfig = this.settingsRepo
      ? await this.settingsRepo.getCreditCardConfig()
      : null;

    const updatedTransactions: Transaction[] = futureTxs.map((tx) => {
      const competenceMonth = toMonthKey(tx.purchaseDate ?? tx.date);
      const [yearStr, monthStr] = competenceMonth.split('-');
      const targetYear = parseInt(yearStr, 10);
      const targetMonthIndex = parseInt(monthStr, 10) - 1;

      const newDay = updatedRule.dayOfMonth;
      const effectiveDate = calculateClampedDate(targetYear, targetMonthIndex, newDay);
      let purchaseDate: string | null = effectiveDate;
      let invoiceMonth: string | null = competenceMonth;
      let date: string = effectiveDate;

      if (
        updatedRule.paymentMethod === PaymentMethod.CREDIT_CARD &&
        cardConfig &&
        cardConfig.isEnabled
      ) {
        const cycle = calculateInvoiceCycle(
          effectiveDate,
          cardConfig.closingDay,
          cardConfig.dueDay
        );
        invoiceMonth = cycle.invoiceMonth;
        date = cycle.dueDate;
        purchaseDate = effectiveDate;
      } else {
        purchaseDate = effectiveDate;
        date = effectiveDate;
        invoiceMonth = null;
      }

      return {
        ...tx,
        description: updatedRule.description,
        amountCents: updatedRule.amountCents,
        categoryId: updatedRule.categoryId,
        paymentMethod: updatedRule.paymentMethod,
        date,
        purchaseDate,
        invoiceMonth,
      };
    });

    await this.transactionRepo.updateMany(updatedTransactions);
  }
}
