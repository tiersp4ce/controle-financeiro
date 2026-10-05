import { ITransactionRepository } from '../../repositories/transaction.repository';
import { Transaction } from '../../entities/transaction';

export class DeleteTransactionUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(id: string): Promise<void> {
    await this.transactionRepository.delete(id);
  }

  async executeGroup(groupId: string): Promise<void> {
    await this.transactionRepository.deleteByInstallmentGroupId(groupId);
  }

  async deleteCurrentAndFutureInstallments(
    installmentGroupId: string,
    fromInstallmentNumber: number
  ): Promise<void> {
    const allTxs = await this.transactionRepository.findByInstallmentGroupId(installmentGroupId);
    if (!allTxs || allTxs.length === 0) return;

    // 1. Remover parcelas da parcela atual em diante
    const toDelete = allTxs.filter(
      (t) => t.installmentNumber !== undefined && t.installmentNumber !== null && t.installmentNumber >= fromInstallmentNumber
    );
    for (const tx of toDelete) {
      await this.transactionRepository.delete(tx.id);
    }

    // 2. Recalcular e atualizar parcelas restantes
    const remaining = allTxs.filter(
      (t) => t.installmentNumber !== undefined && t.installmentNumber !== null && t.installmentNumber < fromInstallmentNumber
    );

    if (remaining.length > 0) {
      const newTotal = remaining.length;
      const updatedRemaining: Transaction[] = remaining.map((t) => {
        const updatedDesc = t.description.replace(
          new RegExp(`\\(${t.installmentNumber}/\\d+\\)$`),
          `(${t.installmentNumber}/${newTotal})`
        );
        return {
          ...t,
          totalInstallments: newTotal,
          description: updatedDesc,
        };
      });

      await this.transactionRepository.updateMany(updatedRemaining);
    }
  }
}

