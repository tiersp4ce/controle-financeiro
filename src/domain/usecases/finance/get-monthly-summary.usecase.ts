import { ITransactionRepository } from '../../repositories/transaction.repository';
import { ICategoryRepository } from '../../repositories/category.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { MonthlySummary, CategoryExpenseBreakdown } from '../../entities/monthly-summary';
import { TransactionType } from '../../enums';

export class GetMonthlySummaryUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly settingsRepository?: ISettingsRepository
  ) {}

  async execute(monthKey: string): Promise<MonthlySummary> {
    const transactions = await this.transactionRepository.findByMonth(monthKey);
    const categories = await this.categoryRepository.findAll();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    let extraIncomeCents = 0;
    let totalExpenseCents = 0;
    const expenseByCategoryMap = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.type === TransactionType.INCOME) {
        extraIncomeCents += tx.amountCents;
      } else {
        /**
         * Raciocínio Contábil de Despesas (Regime de Caixa vs Competência):
         * 
         * 1. Despesa QUITADA (tx.isPaid):
         *    - Se foi paga no mês atual (tx.paidAt começa com monthKey, ou sem paidAt mas data do mês):
         *      DEVE ser computada no totalExpenseCents do mês atual e deduzida do saldo (o dinheiro saiu).
         *    - Se foi paga ANTECIPADAMENTE em um mês anterior ao mês do resumo (paidAt < monthKey):
         *      NÃO deve ser debitada no mês futuro (monthKey)! O caixa já saiu no passado e não compromete
         *      mais o salário deste mês.
         * 
         * 2. Despesa EM ABERTO (!tx.isPaid):
         *    - Se seu vencimento é no mês (tx.date começa com monthKey):
         *      DEVE ser computada no totalExpenseCents como obrigação a pagar no mês.
         */
        const isPaidThisMonth = tx.isPaid && (
          (tx.paidAt && tx.paidAt.startsWith(monthKey)) ||
          (!tx.paidAt && tx.date.startsWith(monthKey))
        );

        const isOpenThisMonth = !tx.isPaid && tx.date.startsWith(monthKey);

        if (isPaidThisMonth || isOpenThisMonth) {
          totalExpenseCents += tx.amountCents;
          const curr = expenseByCategoryMap.get(tx.categoryId) ?? 0;
          expenseByCategoryMap.set(tx.categoryId, curr + tx.amountCents);
        }
      }
    }

    let fixedIncomeCents = 0;
    if (this.settingsRepository) {
      const salaryConfig = await this.settingsRepository.getSalaryConfig();
      if (salaryConfig && salaryConfig.isEnabled && salaryConfig.amountCents > 0) {
        fixedIncomeCents = salaryConfig.amountCents;
      }
    }

    const totalIncomeCents = fixedIncomeCents + extraIncomeCents;

    const breakdown: CategoryExpenseBreakdown[] = [];
    for (const [catId, amount] of expenseByCategoryMap.entries()) {
      const cat = categoryMap.get(catId);
      const percentage = totalExpenseCents > 0 ? (amount / totalExpenseCents) * 100 : 0;
      breakdown.push({
        categoryId: catId,
        categoryName: cat ? cat.name : 'Outros',
        categoryColor: cat ? cat.colorHex : '#9E9E9E',
        categoryIcon: cat ? cat.iconKey : 'help-circle',
        totalCents: amount,
        percentage: Math.round(percentage * 10) / 10,
      });
    }

    breakdown.sort((a, b) => b.totalCents - a.totalCents);

    return {
      monthKey,
      totalIncomeCents,
      fixedIncomeCents,
      extraIncomeCents,
      totalExpenseCents,
      balanceCents: totalIncomeCents - totalExpenseCents,
      breakdown,
    };
  }
}
