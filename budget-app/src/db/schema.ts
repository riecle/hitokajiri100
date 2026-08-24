import type {
  BudgetCategory,
  BudgetGroup,
  Debt,
  Yen,
} from "@/types/budget";

interface FixedItem {
  key: string;
  name: string;
  amount: Yen;
}

interface VariableItem {
  key: string;
  name: string;
  amount: Yen;
}

interface SavingItem {
  key: string;
  name: string;
  amount: Yen;
  group: "saving" | "investment";
}

interface DebtInit {
  name: string;
  balance: Yen;
  annualInterestRate: number;
  monthlyPayment: Yen;
}

const FIXED_ITEMS: FixedItem[] = [
  { key: "amazonPrime", name: "Amazonプライム", amount: 600 },
  { key: "netflix", name: "Netflix", amount: 890 },
  { key: "electricity", name: "電気代", amount: 2000 },
  { key: "gas", name: "ガス代", amount: 3000 },
  { key: "water", name: "水道代", amount: 2000 },
  { key: "rent", name: "家賃", amount: 70000 },
  { key: "mobile", name: "携帯代", amount: 4000 },
  { key: "ai", name: "AI課金", amount: 5000 },
];

const VARIABLE_ITEMS: VariableItem[] = [
  { key: "food", name: "食費", amount: 30000 },
  { key: "haircut", name: "散髪費", amount: 2000 },
  { key: "entertainment", name: "娯楽費", amount: 50000 },
  { key: "dailyGoods", name: "日用品", amount: 10000 },
  { key: "golf", name: "ゴルフ練習", amount: 5000 },
  { key: "voiceTraining", name: "ボイトレ", amount: 10000 },
];

const SAVING_ITEMS: SavingItem[] = [
  { key: "cash", name: "現金貯金", amount: 30000, group: "saving" },
  { key: "nisa", name: "NISA", amount: 40000, group: "investment" },
];

const DEBT_ITEMS: DebtInit[] = [
  {
    name: "アコム",
    balance: 1466873,
    annualInterestRate: 0.18,
    monthlyPayment: 50000,
  },
  {
    name: "楽天",
    balance: 907308,
    annualInterestRate: 0.18,
    monthlyPayment: 35000,
  },
];

export const INITIAL_INCOME: Yen = 350000;

export function buildInitialCategories(
  monthlyBudgetId: string
): Omit<BudgetCategory, "id">[] {
  const categories: Omit<BudgetCategory, "id">[] = [];
  let order = 0;

  for (const item of FIXED_ITEMS) {
    categories.push({
      monthlyBudgetId,
      name: item.name,
      group: "fixed" as BudgetGroup,
      monthlyAmount: item.amount,
      enabled: true,
      sortOrder: order++,
    });
  }

  for (const item of VARIABLE_ITEMS) {
    categories.push({
      monthlyBudgetId,
      name: item.name,
      group: "variable" as BudgetGroup,
      monthlyAmount: item.amount,
      enabled: true,
      sortOrder: order++,
    });
  }

  for (const item of SAVING_ITEMS) {
    categories.push({
      monthlyBudgetId,
      name: item.name,
      group: item.group as BudgetGroup,
      monthlyAmount: item.amount,
      enabled: true,
      sortOrder: order++,
    });
  }

  for (const debt of DEBT_ITEMS) {
    categories.push({
      monthlyBudgetId,
      name: `${debt.name}返済`,
      group: "debt" as BudgetGroup,
      monthlyAmount: debt.monthlyPayment,
      enabled: true,
      sortOrder: order++,
    });
  }

  return categories;
}

export function getInitialDebts(): Omit<Debt, "id" | "createdAt" | "updatedAt">[] {
  return DEBT_ITEMS.map((d) => ({
    name: d.name,
    currentBalance: d.balance,
    annualInterestRate: d.annualInterestRate,
    monthlyPayment: d.monthlyPayment,
  }));
}

export { FIXED_ITEMS, VARIABLE_ITEMS, SAVING_ITEMS, DEBT_ITEMS };
