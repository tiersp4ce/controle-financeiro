export function toIsoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toMonthKey(date: Date | string): string {
  if (typeof date === 'string') {
    return date.substring(0, 7);
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthYearBr(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const date = new Date(year, monthIndex, 1);
  const monthName = date.toLocaleString('pt-BR', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
}

export function formatDateBr(isoDate: string): string {
  if (!isoDate || !isoDate.includes('-')) return isoDate || '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export function brDateToIso(brDate: string): string | null {
  const cleaned = brDate.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;
  const d = cleaned.substring(0, 2);
  const m = cleaned.substring(2, 4);
  const y = cleaned.substring(4, 8);
  const numD = parseInt(d, 10);
  const numM = parseInt(m, 10);
  const numY = parseInt(y, 10);
  if (numM < 1 || numM > 12 || numD < 1 || numD > 31 || numY < 1900 || numY > 2100) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

export function formatBrDateInput(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').substring(0, 8);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
  return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4)}`;
}

export function calculateClampedDate(year: number, monthIndex: number, targetDay: number): string {
  const maxDayInTargetMonth = new Date(year, monthIndex + 1, 0).getDate();
  const actualDay = Math.min(Math.max(1, targetDay), maxDayInTargetMonth);
  const y = year;
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(actualDay).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addMonthsToDate(baseDateIso: string, monthsToAdd: number): string {
  const [yearStr, monthStr, dayStr] = baseDateIso.split('-');
  const baseYear = parseInt(yearStr, 10);
  const baseMonth = parseInt(monthStr, 10) - 1;
  const baseDay = parseInt(dayStr, 10);

  const targetDate = new Date(baseYear, baseMonth + monthsToAdd, 1);
  return calculateClampedDate(targetDate.getFullYear(), targetDate.getMonth(), baseDay);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + delta, 1);
  return toMonthKey(date);
}
