import { ITransactionRepository } from '../../repositories/transaction.repository';
import { RecentFeedItem } from '../../entities/recent-feed';
import { Transaction } from '../../entities/transaction';

/**
 * Consolida as últimas transações do usuário, agrupando parcelas que compartilham o mesmo
 * installmentGroupId para que compras em 10x ou 12x não poluam a listagem inicial do Dashboard.
 */
export class GetConsolidatedRecentFeedUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(limit: number = 5): Promise<RecentFeedItem[]> {
    // Busca transações recentes ordenadas por data desc
    const rawTransactions = await this.transactionRepository.findRecent(limit * 3);
    const seenGroupIds = new Set<string>();
    const feedItems: RecentFeedItem[] = [];

    for (const tx of rawTransactions) {
      if (feedItems.length >= limit) break;

      if (tx.installmentGroupId) {
        // Se já consolidamos este grupo de parcelas, pula as repetições
        if (seenGroupIds.has(tx.installmentGroupId)) {
          continue;
        }
        seenGroupIds.add(tx.installmentGroupId);

        const groupInstallments = await this.transactionRepository.findByInstallmentGroupId(
          tx.installmentGroupId
        );

        if (groupInstallments.length === 0) {
          feedItems.push({
            kind: 'SINGLE',
            id: tx.id,
            date: tx.date,
            createdAt: tx.createdAt,
            transaction: tx,
          });
          continue;
        }

        // Ordena por número de parcela crescente
        groupInstallments.sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));

        const totalAmountCents = groupInstallments.reduce((acc, curr) => acc + curr.amountCents, 0);
        const paidCount = groupInstallments.filter((t) => t.isPaid).length;
        const totalInstallments = tx.totalInstallments ?? groupInstallments.length;

        // Limpa sufixo como " (1/10)" da descrição para exibição consolidada
        const cleanDescription = tx.description.replace(/\s\(\d+\/\d+\)$/, '');

        feedItems.push({
          kind: 'INSTALLMENT_GROUP',
          id: tx.installmentGroupId,
          groupId: tx.installmentGroupId,
          description: cleanDescription,
          totalAmountCents,
          totalInstallments,
          paidInstallmentsCount: paidCount,
          installmentAmountCents: tx.amountCents,
          purchaseDate: tx.purchaseDate ?? tx.date,
          date: tx.date,
          createdAt: tx.createdAt,
          categoryId: tx.categoryId,
          paymentMethod: tx.paymentMethod,
          allInstallments: groupInstallments,
        });
      } else {
        feedItems.push({
          kind: 'SINGLE',
          id: tx.id,
          date: tx.date,
          createdAt: tx.createdAt,
          transaction: tx,
        });
      }
    }

    return feedItems;
  }
}
