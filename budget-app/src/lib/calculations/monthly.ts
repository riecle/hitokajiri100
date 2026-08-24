import type {
  BudgetCategory,
  Transaction,
  DebtPayment,
  Yen,
} from "@/types/budget";

export function actualFixedExpenses(
  categories: BudgetCategory[]
): Yen {
  return categories
    .filter((c) => c.group === "fixed" && c.enabled)
    .reduce((sum, c) => sum + (c.actualAmount ?? c.monthlyAmount), 0);
}

export function actualVariableExpenses(
  transactions: Transaction[],
  categories: BudgetCategory[]
): Yen {
  const variableIds = new Set(
    categories
      .filter((c) => c.group === "variable" && c.enabled)
      .map((c) => c.id)
  );
  return transactions
    .filter((t) => t.type === "expense" && variableIds.has(t.categoryId))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function actualSavings(categories: BudgetCategory[]): Yen {
  return categories
    .filter((c) => c.group === "saving" && c.enabled)
    .reduce((sum, c) => sum + (c.actualAmount ?? c.monthlyAmount), 0);
}

export function actualInvestment(categories: BudgetCategory[]): Yen {
  return categories
    .filter((c) => c.group === "investment" && c.enabled)
    .reduce((sum, c) => sum + (c.actualAmount ?? c.monthlyAmount), 0);
}

export function actualDebtPaymentsForMonth(
  payments: DebtPayment[],
  year: number,
  month: number
): Yen {
  return payments
    .filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    })
    .reduce((sum, p) => sum + p.paymentAmount, 0);
}

export function actualRemaining(
  income: Yen,
  fixedExpenses: Yen,
  variableExpenses: Yen,
  savings: Yen,
  investment: Yen,
  debtPayments: Yen
): Yen {
  return income - fixedExpenses - variableExpenses - savings - investment - debtPayments;
}

export interface MonthlyDiff {
  categoryName: string;
  budget: Yen;
  actual: Yen;
  diff: Yen;
}

export function categoryDiffs(
  categories: BudgetCategory[],
  transactions: Transaction[]
): MonthlyDiff[] {
  return categories
    .filter((c) => c.group === "variable" && c.enabled)
    .map((c) => {
      const actual = transactions
        .filter((t) => t.categoryId === c.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        categoryName: c.name,
        budget: c.monthlyAmount,
        actual,
        diff: c.monthlyAmount - actual,
      };
    });
}
