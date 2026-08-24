"use client";

import { useState } from "react";
import { useMonth } from "@/components/Providers";
import MonthSelector from "@/components/MonthSelector";
import MoneyDisplay from "@/components/MoneyDisplay";
import { useCategories, useTransactions, useAllDebtPayments } from "@/lib/hooks";
import {
  actualFixedExpenses,
  actualVariableExpenses,
  actualSavings,
  actualInvestment,
  actualDebtPaymentsForMonth,
  actualRemaining,
  categoryDiffs,
} from "@/lib/calculations/monthly";
import {
  plannedFixedTotal,
  plannedSavingTotal,
  plannedInvestmentTotal,
  plannedDebtPaymentTotal,
} from "@/lib/calculations/budget";
import {
  updateActualIncome,
  updateCategory,
  finalizeMonth,
} from "@/db/repository";
import { formatMoney } from "@/lib/formatMoney";

export default function MonthlyPage() {
  const { year, month, budget, loading, refresh } = useMonth();
  const categories = useCategories(budget?.id);
  const transactions = useTransactions(budget?.id);
  const debtPayments = useAllDebtPayments();

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");
  const [editingFixed, setEditingFixed] = useState<string | null>(null);
  const [fixedInput, setFixedInput] = useState("");

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const income = budget.actualIncome ?? budget.plannedIncome;
  const fixedExp = actualFixedExpenses(categories);
  const variableExp = actualVariableExpenses(transactions, categories);
  const savings = actualSavings(categories);
  const investment = actualInvestment(categories);
  const debtPay = actualDebtPaymentsForMonth(debtPayments, year, month);
  const remainingAmount = actualRemaining(
    income,
    fixedExp,
    variableExp,
    savings,
    investment,
    debtPay
  );

  const cashOut = fixedExp + variableExp + savings + investment + debtPay;
  const diffs = categoryDiffs(categories, transactions);

  const fixedCategories = categories.filter(
    (c) => c.group === "fixed" && c.enabled
  );
  const savingCategories = categories.filter(
    (c) => c.group === "saving" && c.enabled
  );
  const investmentCategories = categories.filter(
    (c) => c.group === "investment" && c.enabled
  );

  const handleIncomeUpdate = async () => {
    const val = parseInt(incomeInput, 10);
    if (!isNaN(val) && val >= 0) {
      await updateActualIncome(budget.id, val);
      refresh();
    }
    setEditingIncome(false);
  };

  const handleFixedUpdate = async (catId: string) => {
    const val = parseInt(fixedInput, 10);
    if (!isNaN(val) && val >= 0) {
      await updateCategory(catId, { actualAmount: val });
    }
    setEditingFixed(null);
  };

  const handleFinalize = async () => {
    await finalizeMonth(budget.id, !budget.finalized);
    refresh();
  };

  return (
    <div className="pb-4">
      <MonthSelector />

      <div className="bg-gray-800 rounded-2xl mx-4 p-6 mb-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">実際の手取り</span>
            {editingIncome ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-32 bg-gray-700 text-white rounded px-2 py-1 text-right text-sm"
                  autoFocus
                />
                <button
                  onClick={handleIncomeUpdate}
                  className="text-green-400 text-sm"
                >
                  保存
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIncomeInput(String(income));
                  setEditingIncome(true);
                }}
                className="text-blue-400 text-xl font-bold"
              >
                {formatMoney(income)}円
              </button>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">キャッシュアウト</span>
            <span className="text-orange-400 text-xl font-bold">
              {formatMoney(cashOut)}円
            </span>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <MoneyDisplay
              amount={remainingAmount}
              size="lg"
              color={remainingAmount >= 0 ? "green" : "red"}
              label="最終残額"
            />
          </div>
        </div>
      </div>

      <div className="mx-4 mb-4">
        <h3 className="text-gray-400 text-sm font-medium mb-3">
          変動費 予算 vs 実績
        </h3>
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {diffs.map((d, i) => (
            <div
              key={d.categoryName}
              className={`flex items-center justify-between px-4 py-3 ${
                i < diffs.length - 1 ? "border-b border-gray-700" : ""
              }`}
            >
              <span className="text-gray-300 text-sm">{d.categoryName}</span>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-xs">
                  {formatMoney(d.budget)}
                </span>
                <span className="text-orange-400 text-sm font-medium">
                  {formatMoney(d.actual)}
                </span>
                <span
                  className={`text-xs font-medium ${
                    d.diff >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {d.diff >= 0 ? "+" : ""}
                  {formatMoney(d.diff)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-4">
        <h3 className="text-gray-400 text-sm font-medium mb-3">固定費実績</h3>
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {fixedCategories.map((cat, i) => (
            <div
              key={cat.id}
              className={`flex items-center justify-between px-4 py-3 ${
                i < fixedCategories.length - 1 ? "border-b border-gray-700" : ""
              }`}
            >
              <span className="text-gray-300 text-sm">{cat.name}</span>
              {editingFixed === cat.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={fixedInput}
                    onChange={(e) => setFixedInput(e.target.value)}
                    className="w-24 bg-gray-700 text-white rounded px-2 py-1 text-right text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleFixedUpdate(cat.id)}
                    className="text-green-400 text-sm"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setFixedInput(
                      String(cat.actualAmount ?? cat.monthlyAmount)
                    );
                    setEditingFixed(cat.id);
                  }}
                  className="text-gray-300 text-sm"
                >
                  <span className="text-gray-500 text-xs mr-2">
                    予算 {formatMoney(cat.monthlyAmount)}
                  </span>
                  {formatMoney(cat.actualAmount ?? cat.monthlyAmount)}円
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-4">
        <h3 className="text-gray-400 text-sm font-medium mb-3">資産形成</h3>
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {[...savingCategories, ...investmentCategories].map((cat, i, arr) => (
            <div
              key={cat.id}
              className={`flex items-center justify-between px-4 py-3 ${
                i < arr.length - 1 ? "border-b border-gray-700" : ""
              }`}
            >
              <span className="text-gray-300 text-sm">{cat.name}</span>
              <span className="text-blue-400 text-sm font-medium">
                {formatMoney(cat.actualAmount ?? cat.monthlyAmount)}円
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-4">
        <h3 className="text-gray-400 text-sm font-medium mb-3">借金返済</h3>
        <div className="bg-gray-800 rounded-2xl p-4">
          <p className="text-red-400 font-bold">
            {formatMoney(debtPay)}円
          </p>
          <p className="text-gray-500 text-xs mt-1">
            借金ページの返済登録から自動取得
          </p>
        </div>
      </div>

      <div className="mx-4">
        <button
          onClick={handleFinalize}
          className={`w-full py-3 rounded-xl font-bold transition ${
            budget.finalized
              ? "bg-gray-700 text-gray-300"
              : "bg-blue-600 text-white"
          }`}
        >
          {budget.finalized ? "確定を解除" : "この月を確定する"}
        </button>
        {budget.finalized && budget.finalizedAt && (
          <p className="text-gray-500 text-xs text-center mt-2">
            確定済み
          </p>
        )}
      </div>
    </div>
  );
}
