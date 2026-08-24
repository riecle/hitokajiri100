export type Yen = number;

export type BudgetGroup =
  | "fixed"
  | "variable"
  | "saving"
  | "investment"
  | "debt";

export interface MonthlyBudget {
  id: string;
  year: number;
  month: number;
  plannedIncome: Yen;
  actualIncome?: Yen;
  finalized: boolean;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  monthlyBudgetId: string;
  name: string;
  group: BudgetGroup;
  monthlyAmount: Yen;
  actualAmount?: Yen;
  enabled: boolean;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  monthlyBudgetId: string;
  date: string;
  amount: Yen;
  categoryId: string;
  tag?: string;
  memo?: string;
  type: "expense" | "saving" | "investment";
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  name: string;
  currentBalance: Yen;
  annualInterestRate: number;
  monthlyPayment: Yen;
  paymentDay?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  date: string;
  paymentAmount: Yen;
  balanceBefore: Yen;
  balanceAfter: Yen;
  principalReduction: Yen;
  interestAndFees: Yen;
  memo?: string;
  createdAt: string;
}

export const ENTERTAINMENT_TAGS = [
  "交通",
  "飲み会",
  "旅行",
  "デート",
  "遊び",
  "その他",
] as const;

export type EntertainmentTag = (typeof ENTERTAINMENT_TAGS)[number];
