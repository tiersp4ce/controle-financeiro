export interface MonthlySavingsPoint {
  monthKey: string; // YYYY-MM
  incomeCents: number;
  expenseCents: number;
  savingsCents: number;
}

export type FinancialHealthStatus = 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';

export interface SavingsAverageSummary {
  averageMonthlySavingsCents: number;
  averageSavingsRatePercentage: number;
  evaluatedMonthsCount: number;
  bestMonthSavingsCents: number;
  worstMonthSavingsCents: number;
  financialHealthStatus: FinancialHealthStatus;
  insightMessage: string;
  monthlyHistory: MonthlySavingsPoint[];
}
