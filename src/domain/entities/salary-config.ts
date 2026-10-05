export interface SalaryConfig {
  amountCents: number; // Centavos inteiros (ex: 500000 = R$ 5.000,00)
  paymentDay: number;  // Dia do mês (1 a 31)
  isEnabled: boolean;  // Ativar/desativar sem perder configuração
  updatedAt: number;
}
