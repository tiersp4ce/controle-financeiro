import { IRecurringTransactionRepository } from '../../repositories/recurring-transaction.repository';
import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { Transaction } from '../../entities/transaction';
import { PaymentMethod, RecurrenceFrequency } from '../../enums';
import { calculateClampedDate, toMonthKey } from '../../../core/utils/date';
import { calculateInvoiceCycle } from '../../../core/utils/credit-card-cycle';

export interface EnsureRecurringParams {
  targetMonthKey: string; // YYYY-MM
}

export class EnsureRecurringTransactionsUseCase {
  constructor(
    private readonly recurringRepo: IRecurringTransactionRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly settingsRepo?: ISettingsRepository
  ) {}

  async execute(params: EnsureRecurringParams | string): Promise<Transaction[]> {
    const targetMonthKey = typeof params === 'string' ? params : params.targetMonthKey;
    const [yearStr, monthStr] = targetMonthKey.split('-');
    const targetYear = parseInt(yearStr, 10);
    const targetMonthIndex = parseInt(monthStr, 10) - 1;

    const activeRules = await this.recurringRepo.findActive();
    if (activeRules.length === 0) {
      return [];
    }

    const cardConfig = this.settingsRepo
      ? await this.settingsRepo.getCreditCardConfig()
      : null;

    const createdTransactions: Transaction[] = [];

    for (const rule of activeRules) {
      const startMonthKey = toMonthKey(rule.startDate);
      if (startMonthKey > targetMonthKey) {
        continue;
      }

      if (rule.endDate) {
        const endMonthKey = toMonthKey(rule.endDate);
        if (targetMonthKey > endMonthKey) {
          continue;
        }
      }

      if (rule.skippedMonths && rule.skippedMonths.includes(targetMonthKey)) {
        continue;
      }

      // Verifica se a ocorrência para este mês de competência já existe
      const existingTxs = await this.transactionRepo.findByRecurringId(rule.id);
      const alreadyMaterialized = existingTxs.some((t) => {
        const competenceMonth = toMonthKey(t.purchaseDate ?? t.date);
        return competenceMonth === targetMonthKey;
      });

      if (alreadyMaterialized) {
        continue;
      }

      // Materializa ocorrência
      const effectiveDate = calculateClampedDate(targetYear, targetMonthIndex, rule.dayOfMonth);
      let purchaseDate: string | null = effectiveDate;
      let invoiceMonth: string | null = targetMonthKey;
      let date: string = effectiveDate;

      if (
        rule.paymentMethod === PaymentMethod.CREDIT_CARD &&
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

      const tx: Transaction = {
        id: `tx_rec_${rule.id}_${targetMonthKey}`,
        description: rule.description,
        amountCents: rule.amountCents,
        type: rule.type,
        date,
        categoryId: rule.categoryId,
        paymentMethod: rule.paymentMethod,
        recurrence: RecurrenceFrequency.MONTHLY,
        purchaseDate,
        invoiceMonth,
        isPaid: false,
        isAnticipated: false,
        recurringTransactionId: rule.id,
        createdAt: Date.now(),
      };

      createdTransactions.push(tx);
    }

    if (createdTransactions.length > 0) {
      await this.transactionRepo.createMany(createdTransactions);
    }

    return createdTransactions;
  }
}
