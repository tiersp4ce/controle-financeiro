import { PaymentMethod, TransactionType } from '../enums';

export interface RecurringTransaction {
  id: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  dayOfMonth: number; // 1 a 31
  categoryId: string;
  paymentMethod: PaymentMethod;
  startDate: string; // ISO YYYY-MM-DD
  endDate?: string | null; // ISO YYYY-MM-DD ou null se contínua
  skippedMonths: string[]; // Ex: ["2026-04", "2026-08"]
  isActive: boolean;
  createdAt: number;
}
