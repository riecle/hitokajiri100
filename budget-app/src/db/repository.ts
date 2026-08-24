import { db } from "./database";
import { buildInitialCategories, getInitialDebts, INITIAL_INCOME } from "./schema";
import type {
  MonthlyBudget,
  BudgetCategory,
  Transaction,
  Debt,
  DebtPayment,
  Yen,
} from "@/types/budget";

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export async function getOrCreateMonthlyBudget(
  year: number,
  month: number
): Promise<MonthlyBudget> {
  const existing = await db.monthlyBudgets
    .where({ year, month })
    .first();

  if (existing) return existing;

  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const previous = await db.monthlyBudgets
    .where({ year: previousYear, month: previousMonth })
    .first();

  const budget: MonthlyBudget = {
    id: generateId(),
    year,
    month,
    plannedIncome: previous?.plannedIncome ?? INITIAL_INCOME,
    finalized: false,
    createdAt: now(),
    updatedAt: now(),
  };

  await db.monthlyBudgets.add(budget);

  if (previous) {
    const prevCategories = await db.categories
      .where("monthlyBudgetId")
      .equals(previous.id)
      .toArray();

    const newCategories: BudgetCategory[] = prevCategories.map((c) => ({
      ...c,
      id: generateId(),
      monthlyBudgetId: budget.id,
      actualAmount: undefined,
    }));

    await db.categories.bulkAdd(newCategories);
  } else {
    const initialCategories = buildInitialCategories(budget.id);
    const categories: BudgetCategory[] = initialCategories.map((c) => ({
      ...c,
      id: generateId(),
    }));
    await db.categories.bulkAdd(categories);

    const existingDebts = await db.debts.count();
    if (existingDebts === 0) {
      const debtInits = getInitialDebts();
      const debts: Debt[] = debtInits.map((d) => ({
        ...d,
        id: generateId(),
        createdAt: now(),
        updatedAt: now(),
      }));
      await db.debts.bulkAdd(debts);
    }
  }

  return budget;
}

export async function getCategories(
  monthlyBudgetId: string
): Promise<BudgetCategory[]> {
  return db.categories
    .where("monthlyBudgetId")
    .equals(monthlyBudgetId)
    .sortBy("sortOrder");
}

export async function updateCategory(
  id: string,
  updates: Partial<BudgetCategory>
): Promise<void> {
  await db.categories.update(id, updates);
}

export async function addTransaction(
  tx: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<Transaction> {
  const transaction: Transaction = {
    ...tx,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
  };
  await db.transactions.add(transaction);
  return transaction;
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<void> {
  await db.transactions.update(id, { ...updates, updatedAt: now() });
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
}

export async function getTransactions(
  monthlyBudgetId: string
): Promise<Transaction[]> {
  return db.transactions
    .where("monthlyBudgetId")
    .equals(monthlyBudgetId)
    .toArray();
}

export async function getTransactionsByDate(
  monthlyBudgetId: string,
  date: string
): Promise<Transaction[]> {
  return db.transactions
    .where("monthlyBudgetId")
    .equals(monthlyBudgetId)
    .filter((t) => t.date === date)
    .toArray();
}

export async function getDebts(): Promise<Debt[]> {
  return db.debts.toArray();
}

export async function updateDebt(
  id: string,
  updates: Partial<Debt>
): Promise<void> {
  await db.debts.update(id, { ...updates, updatedAt: now() });
}

export async function addDebt(
  debt: Omit<Debt, "id" | "createdAt" | "updatedAt">
): Promise<Debt> {
  const d: Debt = {
    ...debt,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
  };
  await db.debts.add(d);
  return d;
}

export async function deleteDebt(id: string): Promise<void> {
  await db.debtPayments.where("debtId").equals(id).delete();
  await db.debts.delete(id);
}

export async function addDebtPayment(
  payment: Omit<DebtPayment, "id" | "createdAt">
): Promise<DebtPayment> {
  const p: DebtPayment = {
    ...payment,
    id: generateId(),
    createdAt: now(),
  };
  await db.debtPayments.add(p);
  await db.debts.update(payment.debtId, {
    currentBalance: payment.balanceAfter,
    updatedAt: now(),
  });
  return p;
}

export async function getDebtPayments(debtId: string): Promise<DebtPayment[]> {
  return db.debtPayments.where("debtId").equals(debtId).sortBy("date");
}

export async function getAllDebtPayments(): Promise<DebtPayment[]> {
  return db.debtPayments.orderBy("date").toArray();
}

export async function deleteDebtPayment(id: string): Promise<void> {
  await db.debtPayments.delete(id);
}

export async function updateMonthlyBudget(
  id: string,
  updates: Partial<MonthlyBudget>
): Promise<void> {
  await db.monthlyBudgets.update(id, { ...updates, updatedAt: now() });
}

export async function updateActualIncome(
  id: string,
  income: Yen
): Promise<void> {
  await db.monthlyBudgets.update(id, {
    actualIncome: income,
    updatedAt: now(),
  });
}

export async function finalizeMonth(
  id: string,
  finalize: boolean
): Promise<void> {
  await db.monthlyBudgets.update(id, {
    finalized: finalize,
    finalizedAt: finalize ? now() : undefined,
    updatedAt: now(),
  });
}

export async function exportAllData(): Promise<string> {
  const [monthlyBudgets, categories, transactions, debts, debtPayments] =
    await Promise.all([
      db.monthlyBudgets.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.debts.toArray(),
      db.debtPayments.toArray(),
    ]);

  return JSON.stringify(
    { monthlyBudgets, categories, transactions, debts, debtPayments },
    null,
    2
  );
}

export async function importAllData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  await db.transaction(
    "rw",
    [db.monthlyBudgets, db.categories, db.transactions, db.debts, db.debtPayments],
    async () => {
      await db.monthlyBudgets.clear();
      await db.categories.clear();
      await db.transactions.clear();
      await db.debts.clear();
      await db.debtPayments.clear();

      if (data.monthlyBudgets) await db.monthlyBudgets.bulkAdd(data.monthlyBudgets);
      if (data.categories) await db.categories.bulkAdd(data.categories);
      if (data.transactions) await db.transactions.bulkAdd(data.transactions);
      if (data.debts) await db.debts.bulkAdd(data.debts);
      if (data.debtPayments) await db.debtPayments.bulkAdd(data.debtPayments);
    }
  );
}
