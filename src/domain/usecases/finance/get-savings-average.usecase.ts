import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { FinancialHealthStatus, MonthlySavingsPoint, SavingsAverageSummary } from '../../entities/savings-stats';
import { TransactionType } from '../../enums';
import { shiftMonthKey, toMonthKey } from '../../../core/utils/date';

export class GetSavingsAverageUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly settingsRepository?: ISettingsRepository
  ) {}

  async execute(monthsCount: number = 3, upToMonthKey?: string): Promise<SavingsAverageSummary> {
    const endMonthKey = upToMonthKey ?? toMonthKey(new Date());
    const count = Math.max(1, monthsCount);

    let salaryAmount = 0;
    if (this.settingsRepository) {
      const salaryConfig = await this.settingsRepository.getSalaryConfig();
      if (salaryConfig && salaryConfig.isEnabled && salaryConfig.amountCents > 0) {
        salaryAmount = salaryConfig.amountCents;
      }
    }

    const monthKeys: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
      monthKeys.push(shiftMonthKey(endMonthKey, -i));
    }

    const monthlyHistory: MonthlySavingsPoint[] = [];
    let totalIncomeSum = 0;
    let totalExpenseSum = 0;
    let bestMonthSavingsCents = -Infinity;
    let worstMonthSavingsCents = Infinity;

    for (const monthKey of monthKeys) {
      const transactions = await this.transactionRepository.findByMonth(monthKey);
      let monthExtraIncome = 0;
      let monthExpenses = 0;

      for (const tx of transactions) {
        if (tx.type === TransactionType.INCOME) {
          monthExtraIncome += tx.amountCents;
        } else {
          monthExpenses += tx.amountCents;
        }
      }

      const monthIncome = salaryAmount + monthExtraIncome;
      const monthSavings = monthIncome - monthExpenses;

      totalIncomeSum += monthIncome;
      totalExpenseSum += monthExpenses;

      if (monthSavings > bestMonthSavingsCents) {
        bestMonthSavingsCents = monthSavings;
      }
      if (monthSavings < worstMonthSavingsCents) {
        worstMonthSavingsCents = monthSavings;
      }

      monthlyHistory.push({
        monthKey,
        incomeCents: monthIncome,
        expenseCents: monthExpenses,
        savingsCents: monthSavings,
      });
    }

    if (bestMonthSavingsCents === -Infinity) bestMonthSavingsCents = 0;
    if (worstMonthSavingsCents === Infinity) worstMonthSavingsCents = 0;

    const totalSavingsSum = totalIncomeSum - totalExpenseSum;
    const averageMonthlySavingsCents = Math.round(totalSavingsSum / count);
    const averageSavingsRatePercentage = totalIncomeSum > 0
      ? Math.round((totalSavingsSum / totalIncomeSum) * 100)
      : 0;

    let financialHealthStatus: FinancialHealthStatus = 'GOOD';
    let insightMessage = '';

    if (averageSavingsRatePercentage >= 20) {
      financialHealthStatus = 'EXCELLENT';
      insightMessage = 'Excelente! Você está poupando mais de 20% da sua renda média.';
    } else if (averageSavingsRatePercentage >= 10) {
      financialHealthStatus = 'GOOD';
      insightMessage = 'Muito bom! Você mantém uma taxa de economia saudável (10% a 20%).';
    } else if (averageMonthlySavingsCents >= 0) {
      financialHealthStatus = 'WARNING';
      insightMessage = 'Atenção: sua margem de sobra está apertada (abaixo de 10%). Tente reduzir gastos variáveis.';
    } else {
      financialHealthStatus = 'CRITICAL';
      insightMessage = 'Alerta: seus gastos médios estão superando as receitas. Revise seus compromissos financeiros.';
    }

    return {
      averageMonthlySavingsCents,
      averageSavingsRatePercentage,
      evaluatedMonthsCount: count,
      bestMonthSavingsCents,
      worstMonthSavingsCents,
      financialHealthStatus,
      insightMessage,
      monthlyHistory,
    };
  }
}
