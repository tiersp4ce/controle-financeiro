import { ITransactionRepository } from '../../repositories/transaction.repository';
import { Transaction } from '../../entities/transaction';
import { PaymentMethod, TransactionType } from '../../enums';

export interface PayInvoiceInput {
  invoiceMonth: string; // YYYY-MM
  paymentDate: string;  // ISO YYYY-MM-DD
}

export class PayCreditCardInvoiceUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(input: PayInvoiceInput): Promise<Transaction[]> {
    const transactions = await this.transactionRepository.findByInvoiceMonth(input.invoiceMonth);
    const cardExpenses = transactions.filter(
      (tx) => tx.type === TransactionType.EXPENSE && tx.paymentMethod === PaymentMethod.CREDIT_CARD
    );

    const nowIso = new Date().toISOString();
    const updatedList: Transaction[] = [];
    for (const tx of cardExpenses) {
      const updated: Transaction = {
        ...tx,
        isPaid: true,
        // Preserva o timestamp caso uma parcela tenha sido quitada antecipadamente de forma avulsa
        paidAt: tx.paidAt || nowIso,
      };
      await this.transactionRepository.update(updated);
      updatedList.push(updated);
    }

    return updatedList;
  }
}
