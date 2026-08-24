import type { BudgetCategory, Transaction, Yen } from "@/types/budget";

export function sumByGroup(
  categories: BudgetCategory[],
  group: string
): Yen {
  return categories
    .filter((c) => c.group === group && c.enabled)
    .reduce((sum, c) => sum + c.monthlyAmount, 0);
}

export function plannedFixedTotal(categories: BudgetCategory[]): Yen {
  return sumByGroup(categories, "fixed");
}

export function plannedVariableTotal(categories: BudgetCategory[]): Yen {
  return sumByGroup(categories, "variable");
}

export function plannedSavingTotal(categories: BudgetCategory[]): Yen {
  return sumByGroup(categories, "saving");
}

export function plannedInvestmentTotal(categories: BudgetCategory[]): Yen {
  return sumByGroup(categories, "investment");
}

export function plannedDebtPaymentTotal(categories: BudgetCategory[]): Yen {
  return sumByGroup(categories, "debt");
}

export function plannedTotal(categories: BudgetCategory[]): Yen {
  return (
    plannedFixedTotal(categories) +
    plannedVariableTotal(categories) +
    plannedSavingTotal(categories) +
    plannedInvestmentTotal(categories) +
    plannedDebtPaymentTotal(categories)
  );
}

export function plannedRemaining(
  income: Yen,
  categories: BudgetCategory[]
): Yen {
  return income - plannedTotal(categories);
}

export function variableExpenseActual(
  transactions: Transaction[],
  categories: BudgetCategory[]
): Yen {
  const variableCategoryIds = new Set(
    categories
      .filter((c) => c.group === "variable" && c.enabled)
      .map((c) => c.id)
  );
  return transactions
    .filter((t) => t.type === "expense" && variableCategoryIds.has(t.categoryId))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function variableRemaining(
  categories: BudgetCategory[],
  transactions: Transaction[]
): Yen {
  return plannedVariableTotal(categories) - variableExpenseActual(transactions, categories);
}

export function dailyAvailable(
  remaining: Yen,
  remainingDays: number
): Yen {
  if (remaining <= 0 || remainingDays <= 0) return 0;
  return Math.floor(remaining / remainingDays);
}

export function categoryActual(
  categoryId: string,
  transactions: Transaction[]
): Yen {
  return transactions
    .filter((t) => t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function categoryRemaining(
  category: BudgetCategory,
  transactions: Transaction[]
): Yen {
  return category.monthlyAmount - categoryActual(category.id, transactions);
}

export function usagePercent(actual: Yen, budget: Yen): number {
  if (budget === 0) return 0;
  return (actual / budget) * 100;
}

export function usageLevel(
  percent: number
): "normal" | "caution" | "warning" | "danger" {
  if (percent >= 100) return "danger";
  if (percent >= 90) return "warning";
  if (percent >= 70) return "caution";
  return "normal";
}

export function dailyExpenses(
  transactions: Transaction[],
  date: string
): Yen {
  return transactions
    .filter((t) => t.date === date)
    .reduce((sum, t) => sum + t.amount, 0);
}
