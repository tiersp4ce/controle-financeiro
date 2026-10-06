import { Transaction } from './transaction';
import { PaymentMethod } from '../enums';

/**
 * Item do feed recente de atividades no Dashboard.
 * Pode representar uma transação avulsa única ou um grupo consolidado de compras parceladas.
 */
export type RecentFeedItem =
  | {
      kind: 'SINGLE';
      id: string;
      date: string;
      createdAt: number;
      transaction: Transaction;
    }
  | {
      kind: 'INSTALLMENT_GROUP';
      id: string; // installmentGroupId
      groupId: string;
      description: string;
      totalAmountCents: number;
      totalInstallments: number;
      paidInstallmentsCount: number;
      installmentAmountCents: number;
      purchaseDate: string;
      date: string;
      createdAt: number;
      categoryId: string;
      paymentMethod: PaymentMethod;
      allInstallments: Transaction[];
    };
