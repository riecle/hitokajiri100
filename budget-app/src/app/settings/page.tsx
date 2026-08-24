"use client";

import { useState, useRef } from "react";
import { useMonth } from "@/components/Providers";
import { useCategories, useDebts } from "@/lib/hooks";
import {
  updateMonthlyBudget,
  updateCategory,
  updateDebt,
  exportAllData,
  importAllData,
} from "@/db/repository";
import { formatMoney } from "@/lib/formatMoney";
import type { BudgetCategory, Debt } from "@/types/budget";

export default function SettingsPage() {
  const { budget, loading, refresh } = useMonth();
  const categories = useCategories(budget?.id);
  const debts = useDebts();

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const fixedCategories = categories.filter(
    (c) => c.group === "fixed" && c.enabled
  );
  const variableCategories = categories.filter(
    (c) => c.group === "variable" && c.enabled
  );
  const savingCategories = categories.filter(
    (c) => c.group === "saving" && c.enabled
  );
  const investmentCategories = categories.filter(
    (c) => c.group === "investment" && c.enabled
  );

  const startEdit = (field: string, value: number) => {
    setEditField(field);
    setEditValue(String(value));
  };

  const saveEdit = async (
    field: string,
    onSave: (val: number) => Promise<void>
  ) => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val >= 0) {
      await onSave(val);
      refresh();
    }
    setEditField(null);
  };

  const handleExport = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      await importAllData(text);
      setImportStatus("復元しました");
      refresh();
    } catch {
      setImportStatus("復元に失敗しました");
    }
    setTimeout(() => setImportStatus(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const renderEditableRow = (
    label: string,
    fieldKey: string,
    currentValue: number,
    onSave: (val: number) => Promise<void>
  ) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
      <span className="text-gray-300 text-sm">{label}</span>
      {editField === fieldKey ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-28 bg-gray-700 text-white rounded px-2 py-1 text-right text-sm"
            autoFocus
          />
          <button
            onClick={() => saveEdit(fieldKey, onSave)}
            className="text-green-400 text-sm"
          >
            保存
          </button>
          <button
            onClick={() => setEditField(null)}
            className="text-gray-500 text-sm"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => startEdit(fieldKey, currentValue)}
          className="text-gray-300 text-sm"
        >
          {formatMoney(currentValue)}円
        </button>
      )}
    </div>
  );

  return (
    <div className="px-4 py-6 pb-24">
      <h1 className="text-white text-xl font-bold mb-6">設定</h1>

      <Section title="月収">
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {renderEditableRow(
            "手取り給与",
            "income",
            budget.plannedIncome,
            async (val) => {
              await updateMonthlyBudget(budget.id, { plannedIncome: val });
            }
          )}
        </div>
      </Section>

      <Section title="固定費">
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {fixedCategories.map((cat) =>
            renderEditableRow(cat.name, `fixed-${cat.id}`, cat.monthlyAmount, async (val) => {
              await updateCategory(cat.id, { monthlyAmount: val });
            })
          )}
        </div>
      </Section>

      <Section title="変動費予算">
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {variableCategories.map((cat) =>
            renderEditableRow(cat.name, `var-${cat.id}`, cat.monthlyAmount, async (val) => {
              await updateCategory(cat.id, { monthlyAmount: val });
            })
          )}
        </div>
      </Section>

      <Section title="貯金・投資">
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {[...savingCategories, ...investmentCategories].map((cat) =>
            renderEditableRow(cat.name, `save-${cat.id}`, cat.monthlyAmount, async (val) => {
              await updateCategory(cat.id, { monthlyAmount: val });
            })
          )}
        </div>
      </Section>

      <Section title="借金設定">
        <div className="space-y-3">
          {debts.map((debt) => (
            <DebtSettings key={debt.id} debt={debt} />
          ))}
        </div>
      </Section>

      <Section title="バックアップ">
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl active:bg-blue-700"
          >
            JSONエクスポート
          </button>
          <label className="block w-full bg-gray-700 text-gray-300 font-bold py-3 rounded-xl text-center cursor-pointer active:bg-gray-600">
            JSONインポート
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {importStatus && (
            <p className="text-center text-sm text-green-400">
              {importStatus}
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-gray-400 text-sm font-medium mb-2">{title}</h2>
      {children}
    </div>
  );
}

function DebtSettings({ debt }: { debt: Debt }) {
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const save = async (
    field: string,
    transform: (val: string) => Partial<Debt>
  ) => {
    const updates = transform(editValue);
    await updateDebt(debt.id, updates);
    setEditField(null);
  };

  const row = (
    label: string,
    fieldKey: string,
    display: string,
    transform: (val: string) => Partial<Debt>
  ) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
      <span className="text-gray-300 text-sm">{label}</span>
      {editField === fieldKey ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-28 bg-gray-700 text-white rounded px-2 py-1 text-right text-sm"
            autoFocus
          />
          <button
            onClick={() => save(fieldKey, transform)}
            className="text-green-400 text-sm"
          >
            保存
          </button>
          <button
            onClick={() => setEditField(null)}
            className="text-gray-500 text-sm"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setEditField(fieldKey);
            setEditValue(display.replace(/[^0-9.]/g, ""));
          }}
          className="text-gray-300 text-sm"
        >
          {display}
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <span className="text-white font-bold">{debt.name}</span>
      </div>
      {row("残高", `balance-${debt.id}`, `${formatMoney(debt.currentBalance)}円`, (v) => ({
        currentBalance: parseInt(v, 10),
      }))}
      {row(
        "年利",
        `rate-${debt.id}`,
        `${(debt.annualInterestRate * 100).toFixed(0)}%`,
        (v) => ({ annualInterestRate: parseFloat(v) / 100 })
      )}
      {row("月返済額", `payment-${debt.id}`, `${formatMoney(debt.monthlyPayment)}円`, (v) => ({
        monthlyPayment: parseInt(v, 10),
      }))}
      {row(
        "返済日",
        `day-${debt.id}`,
        debt.paymentDay ? `${debt.paymentDay}日` : "未設定",
        (v) => ({ paymentDay: parseInt(v, 10) || undefined })
      )}
    </div>
  );
}
