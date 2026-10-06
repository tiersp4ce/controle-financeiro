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

/**
 * Mapeia enums técnicos de formas de pagamento para rótulos legíveis e amigáveis em português.
 * Suporta o enum formal PaymentMethod ou strings diretas persistidas.
 */
export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return 'Outro';
  switch (method) {
    case 'CREDIT_CARD':
      return 'Cartão de Crédito';
    case 'DEBIT_CARD':
      return 'Cartão de Débito';
    case 'BANK_SLIP':
      return 'Boleto';
    case 'PIX':
      return 'Pix';
    case 'CASH':
      return 'Dinheiro';
    case 'OTHER':
    default:
      return 'Outro';
  }
}

