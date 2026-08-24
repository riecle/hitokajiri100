"use client";

import Link from "next/link";
import { useMonth } from "@/components/Providers";
import MonthSelector from "@/components/MonthSelector";
import MoneyDisplay from "@/components/MoneyDisplay";
import CategoryProgress from "@/components/CategoryProgress";
import { useCategories, useTransactions } from "@/lib/hooks";
import {
  variableRemaining,
  variableExpenseActual,
  plannedVariableTotal,
  plannedRemaining,
  dailyAvailable,
  categoryActual,
} from "@/lib/calculations/budget";
import { remainingDaysInMonth, tokyoToday } from "@/lib/date";
import { formatMoney } from "@/lib/formatMoney";

export default function BudgetPage() {
  const { year, month, budget, loading } = useMonth();
  const categories = useCategories(budget?.id);
  const transactions = useTransactions(budget?.id);

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const today = tokyoToday();
  const remaining = variableRemaining(categories, transactions);
  const spent = variableExpenseActual(transactions, categories);
  const variableTotal = plannedVariableTotal(categories);
  const unallocated = plannedRemaining(budget.plannedIncome, categories);
  const daysLeft = remainingDaysInMonth(year, month, today);
  const daily = dailyAvailable(remaining, daysLeft);
  const isOverBudget = remaining < 0;

  const variableCategories = categories.filter(
    (c) => c.group === "variable" && c.enabled
  );

  return (
    <div className="pb-4">
      <div className="flex items-center justify-end px-4 pt-2">
        <Link href="/settings" className="text-gray-500 text-xl">
          ⚙
        </Link>
      </div>
      <MonthSelector />

      <div className="bg-gray-800 rounded-2xl mx-4 p-6 mb-4">
        {isOverBudget ? (
          <>
            <p className="text-center text-red-400 text-sm mb-2">予算超過</p>
            <MoneyDisplay amount={remaining} size="xl" color="red" />
          </>
        ) : (
          <>
            <p className="text-center text-gray-400 text-sm mb-2">
              今月あと使える
            </p>
            <MoneyDisplay amount={remaining} size="xl" color="green" />
          </>
        )}

        <div className="mt-4 text-center">
          <p className="text-gray-500 text-xs">残り{daysLeft}日</p>
          <p className="text-gray-400 text-sm mt-1">1日あたり</p>
          <p className="text-white text-2xl font-bold">
            {formatMoney(daily)}
            <span className="text-sm ml-1">円まで</span>
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl mx-4 p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-xs">今月使った</p>
            <p className="text-orange-400 text-xl font-bold">
              {formatMoney(spent)}円
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">変動費予算</p>
            <p className="text-gray-300 text-xl font-bold">
              {formatMoney(variableTotal)}円
            </p>
          </div>
        </div>
      </div>

      {unallocated > 0 && (
        <div className="bg-gray-800 rounded-2xl mx-4 p-4 mb-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">予備費</p>
            <p className="text-gray-300 font-bold">
              {formatMoney(unallocated)}円
            </p>
          </div>
        </div>
      )}

      <div className="mx-4 space-y-3">
        <h3 className="text-gray-400 text-sm font-medium">カテゴリ別残高</h3>
        {variableCategories.map((cat) => (
          <CategoryProgress
            key={cat.id}
            name={cat.name}
            actual={categoryActual(cat.id, transactions)}
            budget={cat.monthlyAmount}
          />
        ))}
      </div>
    </div>
  );
}
