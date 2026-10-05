import { shiftMonthKey, toMonthKey } from './date';

export interface InvoiceCycleResult {
  invoiceMonth: string;      // YYYY-MM da fatura de competência (vencimento)
  closingDate: string;       // ISO YYYY-MM-DD
  dueDate: string;           // ISO YYYY-MM-DD
  isAfterClosing: boolean;   // Se a compra ocorreu no dia ou após o fechamento
}

/**
 * Retorna o dia seguro para um mês/ano (ex: dia 31 em Fevereiro vira 28 ou 29).
 */
export function safeDayForMonth(year: number, monthIndex: number, desiredDay: number): number {
  const maxDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(desiredDay, maxDaysInMonth);
}

/**
 * Formata ano, mês (1-12) e dia em string ISO YYYY-MM-DD segura.
 */
export function formatSafeDate(year: number, month1To12: number, desiredDay: number): string {
  const monthIndex = month1To12 - 1;
  const targetDate = new Date(year, monthIndex, 1);
  const actualYear = targetDate.getFullYear();
  const actualMonth = targetDate.getMonth() + 1;
  const actualDay = safeDayForMonth(actualYear, targetDate.getMonth(), desiredDay);

  const yStr = String(actualYear);
  const mStr = String(actualMonth).padStart(2, '0');
  const dStr = String(actualDay).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

/**
 * Calcula em qual fatura (invoiceMonth) uma compra cai e quais as datas de fechamento e vencimento.
 * 
 * Regra Padrão (Vencimento >= Fechamento, ex: Fecha dia 10, Vence dia 20):
 * - Compra antes do dia 10: fatura do mês atual (fecha 10/MM, vence 20/MM)
 * - Compra dia 10 ou depois: fatura do mês seguinte (fecha 10/(MM+1), vence 20/(MM+1))
 * 
 * Regra com Virada de Mês (Vencimento < Fechamento, ex: Fecha dia 25, Vence dia 05):
 * - Compra antes do dia 25: fecha 25/MM, vence 05/(MM+1). Competência/Mês de vencimento: MM+1
 * - Compra dia 25 ou depois: fecha 25/(MM+1), vence 05/(MM+2). Competência/Mês de vencimento: MM+2
 */
export function calculateInvoiceCycle(
  purchaseDateIso: string,
  closingDay: number,
  dueDay: number
): InvoiceCycleResult {
  const [yStr, mStr, dStr] = purchaseDateIso.split('-');
  const purchaseYear = parseInt(yStr, 10);
  const purchaseMonth = parseInt(mStr, 10);
  const purchaseDay = parseInt(dStr, 10);

  const isAfterClosing = purchaseDay >= closingDay;

  if (dueDay >= closingDay) {
    // Ciclo dentro do mesmo mês civil
    const invoiceDeltaMonths = isAfterClosing ? 1 : 0;
    const baseMonthKey = `${yStr}-${mStr}`;
    const invoiceMonth = shiftMonthKey(baseMonthKey, invoiceDeltaMonths);

    const [invYStr, invMStr] = invoiceMonth.split('-');
    const invYear = parseInt(invYStr, 10);
    const invMonth = parseInt(invMStr, 10);

    const closingDate = formatSafeDate(invYear, invMonth, closingDay);
    const dueDate = formatSafeDate(invYear, invMonth, dueDay);

    return {
      invoiceMonth,
      closingDate,
      dueDate,
      isAfterClosing,
    };
  } else {
    // Ciclo com virada de mês (ex: Fecha dia 25 de Setembro, Vence dia 05 de Outubro)
    const closingDeltaMonths = isAfterClosing ? 1 : 0;
    const dueDeltaMonths = closingDeltaMonths + 1;

    const baseMonthKey = `${yStr}-${mStr}`;
    const invoiceMonth = shiftMonthKey(baseMonthKey, dueDeltaMonths);

    const closingMonthKey = shiftMonthKey(baseMonthKey, closingDeltaMonths);
    const [clYStr, clMStr] = closingMonthKey.split('-');
    const [invYStr, invMStr] = invoiceMonth.split('-');

    const closingDate = formatSafeDate(parseInt(clYStr, 10), parseInt(clMStr, 10), closingDay);
    const dueDate = formatSafeDate(parseInt(invYStr, 10), parseInt(invMStr, 10), dueDay);

    return {
      invoiceMonth,
      closingDate,
      dueDate,
      isAfterClosing,
    };
  }
}

/**
 * Retorna as datas de fechamento e vencimento para um invoiceMonth específico.
 */
export function getInvoiceDatesForMonth(
  invoiceMonthKey: string,
  closingDay: number,
  dueDay: number
): { closingDate: string; dueDate: string } {
  const [invYStr, invMStr] = invoiceMonthKey.split('-');
  const invYear = parseInt(invYStr, 10);
  const invMonth = parseInt(invMStr, 10);

  if (dueDay >= closingDay) {
    return {
      closingDate: formatSafeDate(invYear, invMonth, closingDay),
      dueDate: formatSafeDate(invYear, invMonth, dueDay),
    };
  } else {
    // O fechamento ocorreu no mês anterior ao vencimento
    const closingMonthKey = shiftMonthKey(invoiceMonthKey, -1);
    const [clYStr, clMStr] = closingMonthKey.split('-');
    return {
      closingDate: formatSafeDate(parseInt(clYStr, 10), parseInt(clMStr, 10), closingDay),
      dueDate: formatSafeDate(invYear, invMonth, dueDay),
    };
  }
}
