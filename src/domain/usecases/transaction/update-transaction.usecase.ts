import { ITransactionRepository } from '../../repositories/transaction.repository';
import { Transaction } from '../../entities/transaction';

export interface UpdateInstallmentGroupInput {
  installmentGroupId: string;
  description?: string;
  categoryId?: string;
}

export class UpdateTransactionUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(transaction: Transaction): Promise<void> {
    if (transaction.amountCents <= 0) {
      throw new Error('Valor deve ser positivo.');
    }
    const existing = await this.transactionRepository.findById(transaction.id);
    if (!existing) {
      throw new Error('Transação não encontrada.');
    }
    await this.transactionRepository.update(transaction);
  }

  async updateInstallmentGroup(input: UpdateInstallmentGroupInput): Promise<void> {
    if (!input.installmentGroupId) {
      throw new Error('ID do grupo de parcelas é obrigatório.');
    }

    const groupTxs = await this.transactionRepository.findByInstallmentGroupId(input.installmentGroupId);
    if (!groupTxs || groupTxs.length === 0) {
      throw new Error('Nenhuma parcela encontrada para o grupo informado.');
    }

    const cleanBaseDesc = input.description
      ? input.description.replace(/\s*\(\d+\/\d+\)$/, '').trim()
      : undefined;

    const updatedTxs: Transaction[] = groupTxs.map((tx) => {
      const updated: Transaction = { ...tx };

      if (cleanBaseDesc !== undefined && cleanBaseDesc.length > 0) {
        if (tx.installmentNumber && tx.totalInstallments) {
          updated.description = `${cleanBaseDesc} (${tx.installmentNumber}/${tx.totalInstallments})`;
        } else {
          updated.description = cleanBaseDesc;
        }
      }

      if (input.categoryId !== undefined) {
        updated.categoryId = input.categoryId;
      }

      return updated;
    });

    await this.transactionRepository.updateMany(updatedTxs);
  }
}

