import { ITransactionRepository } from '../../repositories/transaction.repository';
import { Transaction } from '../../entities/transaction';

export interface ToggleTransactionPaidInput {
  transactionId: string;
  isPaid?: boolean;       // Se omitido, inverte o status atual de pagamento
  paidAt?: string | null; // Se omitido e for marcar como pago, usa a data/hora atual em ISO
}

/**
 * Caso de uso didático para liquidação pontual de despesas e parcelas avulsas.
 *
 * Permite ao usuário dar baixa imediata em uma conta ("Quitar Agora"),
 * registrando com exatidão o timestamp de quitação (paidAt), ou desfazer o pagamento
 * caso tenha sido marcado por engano.
 */
export class ToggleTransactionPaidUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(input: ToggleTransactionPaidInput): Promise<Transaction> {
    const tx = await this.transactionRepository.findById(input.transactionId);
    if (!tx) {
      throw new Error(`Transação com id "${input.transactionId}" não encontrada.`);
    }

    // Se o caller especificou isPaid, usa esse valor; caso contrário, inverte o status atual
    const nextIsPaid = input.isPaid !== undefined ? input.isPaid : !tx.isPaid;
    let nextPaidAt: string | null = null;

    if (nextIsPaid) {
      // Se está marcando como pago, registra a data e hora informada ou o momento atual
      nextPaidAt = input.paidAt !== undefined ? input.paidAt : (tx.paidAt || new Date().toISOString());
    } else {
      // Se está desmarcando, remove a data de quitação
      nextPaidAt = null;
    }

    const updated: Transaction = {
      ...tx,
      isPaid: nextIsPaid,
      paidAt: nextPaidAt,
    };

    await this.transactionRepository.update(updated);
    return updated;
  }
}
