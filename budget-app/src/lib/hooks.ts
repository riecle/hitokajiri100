"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/database";
import type {
  MonthlyBudget,
  BudgetCategory,
  Transaction,
  Debt,
  DebtPayment,
} from "@/types/budget";

export function useMonthlyBudget(
  year: number,
  month: number
): MonthlyBudget | undefined {
  return useLiveQuery(
    () => db.monthlyBudgets.where({ year, month }).first(),
    [year, month]
  );
}

export function useCategories(
  monthlyBudgetId: string | undefined
): BudgetCategory[] {
  return (
    useLiveQuery(
      () =>
        monthlyBudgetId
          ? db.categories
              .where("monthlyBudgetId")
              .equals(monthlyBudgetId)
              .sortBy("sortOrder")
          : [],
      [monthlyBudgetId]
    ) ?? []
  );
}

export function useTransactions(
  monthlyBudgetId: string | undefined
): Transaction[] {
  return (
    useLiveQuery(
      () =>
        monthlyBudgetId
          ? db.transactions
              .where("monthlyBudgetId")
              .equals(monthlyBudgetId)
              .toArray()
          : [],
      [monthlyBudgetId]
    ) ?? []
  );
}

export function useDebts(): Debt[] {
  return useLiveQuery(() => db.debts.toArray()) ?? [];
}

export function useDebtPayments(debtId?: string): DebtPayment[] {
  return (
    useLiveQuery(
      () =>
        debtId
          ? db.debtPayments.where("debtId").equals(debtId).sortBy("date")
          : db.debtPayments.orderBy("date").toArray(),
      [debtId]
    ) ?? []
  );
}

export function useAllDebtPayments(): DebtPayment[] {
  return (
    useLiveQuery(() => db.debtPayments.orderBy("date").toArray()) ?? []
  );
}
