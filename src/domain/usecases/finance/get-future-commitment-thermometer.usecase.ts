import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { CommitmentLevel, FutureCommitmentThermometer } from '../../entities/thermometer';
import { TransactionType } from '../../enums';

export class GetFutureCommitmentThermometerUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly settingsRepository?: ISettingsRepository
  ) {}

  async execute(monthKey: string, baselineMonthlyIncomeCents?: number): Promise<FutureCommitmentThermometer> {
    const transactions = await this.transactionRepository.findByMonth(monthKey);

    let monthIncome = 0;
    let committedExpenses = 0;

    for (const tx of transactions) {
      if (tx.type === TransactionType.INCOME) {
        monthIncome += tx.amountCents;
      } else {
        committedExpenses += tx.amountCents;
      }
    }

    let salaryAmount = 0;
    if (this.settingsRepository) {
      const salaryConfig = await this.settingsRepository.getSalaryConfig();
      if (salaryConfig && salaryConfig.isEnabled && salaryConfig.amountCents > 0) {
        salaryAmount = salaryConfig.amountCents;
      }
    }

    const effectiveIncome = (monthIncome + salaryAmount) > 0
      ? (monthIncome + salaryAmount)
      : (baselineMonthlyIncomeCents ?? 0);

    // UX-01: Quando o usuário não possui renda cadastrada ou ela é zerada,
    // o termômetro assume estado neutro ('GRAY') sem alarmar o usuário com 100% de endividamento
    if (effectiveIncome <= 0) {
      return {
        monthKey,
        totalCommittedCents: committedExpenses,
        totalProjectedIncomeCents: 0,
        commitmentPercentage: 0,
        level: 'GRAY',
        feedbackMessage: 'Cadastre sua renda mensal para acompanhar seu comprometimento financeiro.',
      };
    }

    const percentage = Math.round((committedExpenses / effectiveIncome) * 100);

    let level: CommitmentLevel = 'GREEN';
    let feedbackMessage = 'Suas finanças para este mês estão sob controle.';

    if (percentage > 70) {
      level = 'RED';
      feedbackMessage = 'Atenção! Mais de 70% da sua renda está comprometida neste mês.';
    } else if (percentage > 40) {
      level = 'YELLOW';
      feedbackMessage = 'Atenção moderada: seu comprometimento financeiro está entre 40% e 70%.';
    }

    return {
      monthKey,
      totalCommittedCents: committedExpenses,
      totalProjectedIncomeCents: effectiveIncome,
      commitmentPercentage: percentage,
      level,
      feedbackMessage,
    };
  }
}
