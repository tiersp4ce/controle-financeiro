export function centsToCurrency(amountCents: number): string {
  const isNegative = amountCents < 0;
  const absCents = Math.abs(amountCents);
  const reais = Math.floor(absCents / 100);
  const cents = absCents % 100;

  const formattedReais = reais.toLocaleString('pt-BR');
  const formattedCents = cents.toString().padStart(2, '0');
  const sign = isNegative ? '-' : '';

  return `${sign}R$ ${formattedReais},${formattedCents}`;
}

export function currencyMaskToCents(text: string): number {
  const digitsOnly = text.replace(/\D/g, '');
  if (!digitsOnly) return 0;
  return parseInt(digitsOnly, 10);
}

export function formatCentsInput(cents: number): string {
  const reais = Math.floor(cents / 100);
  const decimal = cents % 100;
  return `R$ ${reais.toLocaleString('pt-BR')},${decimal.toString().padStart(2, '0')}`;
}
