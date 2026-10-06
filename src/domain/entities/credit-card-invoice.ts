import { Transaction } from './transaction';

export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'FUTURE';

export interface CreditCardInvoiceSummary {
  invoiceMonth: string;          // YYYY-MM (Mês de competência/vencimento)
  closingDate: string;           // ISO YYYY-MM-DD (Data de fechamento)
  dueDate: string;               // ISO YYYY-MM-DD (Data de vencimento)
  status: InvoiceStatus;         // OPEN: recebendo compras | CLOSED: fechada aguardando pagamento | PAID: quitada | FUTURE: compras futuras
  totalAmountCents: number;      // Total de gastos da fatura em centavos
  paidAmountCents: number;       // Total já pago
  remainingAmountCents: number;  // Saldo devedor restante
  transactionsCount: number;
  transactions: Transaction[];
  paidAt?: string | null;        // Data/hora da quitação da fatura quando status === 'PAID'
}

export interface InvoicesOverview {
  currentOpenInvoice: CreditCardInvoiceSummary;
  lastClosedInvoice?: CreditCardInvoiceSummary | null;
  futureInvoices: CreditCardInvoiceSummary[];
  totalFutureCommittedCents: number;
}
