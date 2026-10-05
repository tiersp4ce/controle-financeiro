export interface CategoryExpenseBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  totalCents: number;
  percentage: number;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  totalIncomeCents: number;
  fixedIncomeCents: number;
  extraIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;
  breakdown: CategoryExpenseBreakdown[];
}
