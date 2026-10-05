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

    const updatedList: Transaction[] = [];
    for (const tx of cardExpenses) {
      const updated: Transaction = {
        ...tx,
        isPaid: true,
      };
      await this.transactionRepository.update(updated);
      updatedList.push(updated);
    }

    return updatedList;
  }
}
