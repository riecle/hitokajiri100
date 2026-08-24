import Dexie, { type EntityTable } from "dexie";
import type {
  MonthlyBudget,
  BudgetCategory,
  Transaction,
  Debt,
  DebtPayment,
} from "@/types/budget";

class BudgetDatabase extends Dexie {
  monthlyBudgets!: EntityTable<MonthlyBudget, "id">;
  categories!: EntityTable<BudgetCategory, "id">;
  transactions!: EntityTable<Transaction, "id">;
  debts!: EntityTable<Debt, "id">;
  debtPayments!: EntityTable<DebtPayment, "id">;

  constructor() {
    super("BudgetApp");
    this.version(1).stores({
      monthlyBudgets: "id, [year+month]",
      categories: "id, monthlyBudgetId, group, [monthlyBudgetId+group]",
      transactions: "id, monthlyBudgetId, date, categoryId, [monthlyBudgetId+categoryId]",
      debts: "id",
      debtPayments: "id, debtId, date",
    });
  }
}

export const db = new BudgetDatabase();
