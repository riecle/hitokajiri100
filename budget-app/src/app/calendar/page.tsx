"use client";

import { useState } from "react";
import { useMonth } from "@/components/Providers";
import MonthSelector from "@/components/MonthSelector";
import { useCategories, useTransactions } from "@/lib/hooks";
import {
  getMonthDays,
  getWeekdayIndex,
  formatDateKey,
  daysInMonth,
} from "@/lib/date";
import {
  dailyExpenses,
  variableExpenseActual,
  plannedVariableTotal,
} from "@/lib/calculations/budget";
import { deleteTransaction, updateTransaction } from "@/db/repository";
import { formatMoney } from "@/lib/formatMoney";
import { format } from "date-fns";
import type { Transaction } from "@/types/budget";
import { ENTERTAINMENT_TAGS } from "@/types/budget";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export default function CalendarPage() {
  const { year, month, budget, loading } = useMonth();
  const categories = useCategories(budget?.id);
  const transactions = useTransactions(budget?.id);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const days = getMonthDays(year, month);
  const firstDayOffset = getWeekdayIndex(days[0]);
  const totalDays = daysInMonth(year, month);

  const spent = variableExpenseActual(transactions, categories);
  const variableTotal = plannedVariableTotal(categories);

  const selectedTransactions = selectedDate
    ? transactions.filter((t) => t.date === selectedDate)
    : [];

  const selectedTotal = selectedTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="pb-4">
      <MonthSelector />

      <div className="bg-gray-800 rounded-2xl mx-4 p-4 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">今月の変動費</span>
          <span className="text-gray-300 text-sm">
            {formatMoney(spent)}円 / {formatMoney(variableTotal)}円
          </span>
        </div>
      </div>

      <div className="mx-4 bg-gray-800 rounded-2xl p-3 mb-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-xs py-1 ${
                i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-gray-500"
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const expense = dailyExpenses(transactions, dateKey);
            const isSelected = selectedDate === dateKey;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={`rounded-lg p-1 text-center min-h-[52px] flex flex-col items-center justify-start ${
                  isSelected
                    ? "bg-orange-500/20 ring-1 ring-orange-500"
                    : "active:bg-gray-700"
                }`}
              >
                <span className="text-xs text-gray-300">{day}</span>
                {expense > 0 && (
                  <span className="text-[10px] text-orange-400 mt-0.5">
                    {formatMoney(expense)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mx-4 bg-gray-800 rounded-2xl p-4">
          <h3 className="text-white font-bold mb-3">
            {format(new Date(selectedDate), "M月d日")}
          </h3>

          {selectedTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">支出なし</p>
          ) : (
            <div className="space-y-2">
              {selectedTransactions.map((t) => {
                const cat = categoryMap.get(t.categoryId);
                const isEntertainment = cat?.name === "娯楽費";

                if (editingTx?.id === t.id) {
                  return (
                    <div key={t.id} className="bg-gray-700 rounded-xl p-3 space-y-2">
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="w-full bg-gray-600 text-white rounded px-2 py-2 text-sm"
                      >
                        {categories
                          .filter((c) => c.group === "variable" && c.enabled)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full bg-gray-600 text-white rounded px-2 py-2 text-sm"
                        placeholder="金額"
                      />
                      {categories.find((c) => c.id === editCategoryId)?.name ===
                        "娯楽費" && (
                        <select
                          value={editTag}
                          onChange={(e) => setEditTag(e.target.value)}
                          className="w-full bg-gray-600 text-white rounded px-2 py-2 text-sm"
                        >
                          <option value="">タグなし</option>
                          {ENTERTAINMENT_TAGS.map((tag) => (
                            <option key={tag} value={tag}>
                              {tag}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        className="w-full bg-gray-600 text-white rounded px-2 py-2 text-sm"
                        placeholder="メモ"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTx(null)}
                          className="flex-1 bg-gray-600 text-gray-300 py-2 rounded text-sm"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={async () => {
                            const val = parseInt(editAmount, 10);
                            if (!isNaN(val) && val > 0) {
                              await updateTransaction(t.id, {
                                amount: val,
                                categoryId: editCategoryId,
                                tag: editTag || undefined,
                                memo: editMemo || undefined,
                              });
                            }
                            setEditingTx(null);
                          }}
                          className="flex-1 bg-orange-500 text-white py-2 rounded text-sm font-bold"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={t.id}>
                    <button
                      onClick={() => {
                        setEditingTx(t);
                        setEditAmount(String(t.amount));
                        setEditMemo(t.memo ?? "");
                        setEditTag(t.tag ?? "");
                        setEditCategoryId(t.categoryId);
                      }}
                      className="w-full flex justify-between items-center py-2 border-b border-gray-700 last:border-0 text-left"
                    >
                      <div>
                        <p className="text-gray-300 text-sm">
                          {cat?.name ?? "不明"}
                        </p>
                        {t.tag && (
                          <span className="text-xs text-gray-500">
                            #{t.tag}
                          </span>
                        )}
                        {t.memo && (
                          <p className="text-xs text-gray-500">{t.memo}</p>
                        )}
                      </div>
                      <p className="text-orange-400 font-bold">
                        {formatMoney(t.amount)}円
                      </p>
                    </button>
                    {confirmDelete === t.id ? (
                      <div className="bg-red-900/30 rounded-lg p-2 mt-1 flex items-center justify-between">
                        <span className="text-red-400 text-xs">
                          この支出を削除しますか？
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-gray-400 text-xs px-2 py-1"
                          >
                            いいえ
                          </button>
                          <button
                            onClick={async () => {
                              await deleteTransaction(t.id);
                              setConfirmDelete(null);
                            }}
                            className="text-red-400 text-xs px-2 py-1 font-bold"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 -mt-1">
                        <button
                          onClick={() => setConfirmDelete(t.id)}
                          className="text-red-500/60 text-xs py-1"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-2 flex justify-between">
                <span className="text-gray-400 text-sm">本日の支出</span>
                <span className="text-orange-400 font-bold">
                  {formatMoney(selectedTotal)}円
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
