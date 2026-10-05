export interface CreditCardConfig {
  cardName: string;           // Ex: "Meu Cartão", "Nubank", "Inter"
  closingDay: number;         // 1 a 31 (Dia em que a fatura fecha)
  dueDay: number;             // 1 a 31 (Dia em que a fatura vence)
  limitCents?: number | null; // Limite do cartão em centavos inteiros (opcional)
  isEnabled: boolean;         // Ativar/desativar comportamento inteligente de fatura
  updatedAt: number;
}

export const DEFAULT_CREDIT_CARD_CONFIG: CreditCardConfig = {
  cardName: 'Cartão de Crédito',
  closingDay: 10,
  dueDay: 20,
  limitCents: 0,
  isEnabled: true,
  updatedAt: 0,
};
