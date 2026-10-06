import { PaymentMethod, RecurrenceFrequency, TransactionType } from '../enums';

export interface Transaction {
  id: string;
  description: string;
  amountCents: number; // Inteiro em centavos
  type: TransactionType;
  date: string; // ISO YYYY-MM-DD (Data financeira no extrato)
  categoryId: string;
  paymentMethod: PaymentMethod;
  recurrence: RecurrenceFrequency;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
  purchaseDate?: string | null; // Data real em que a compra foi feita
  invoiceMonth?: string | null; // Mês da fatura correspondente (YYYY-MM)
  isPaid?: boolean;             // Se a transação/fatura foi quitada
  paidAt?: string | null;       // ISO YYYY-MM-DDTHH:mm:ss.sssZ (Timestamp exato da quitação)
  isAnticipated?: boolean;      // Se foi antecipada
  notes?: string | null;        // Anotações contextuais livres opcionais
  recurringTransactionId?: string | null; // ID da regra recorrente de origem
  createdAt: number;
}
