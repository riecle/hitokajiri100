"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMonth } from "@/components/Providers";
import { useCategories } from "@/lib/hooks";
import { addTransaction } from "@/db/repository";
import { formatDateKey, tokyoToday } from "@/lib/date";
import { ENTERTAINMENT_TAGS } from "@/types/budget";

export default function NewTransactionPage() {
  const router = useRouter();
  const { budget, loading } = useMonth();
  const categories = useCategories(budget?.id);
  const variableCategories = categories.filter(
    (c) => c.group === "variable" && c.enabled
  );

  const [date, setDate] = useState(formatDateKey(tokyoToday()));
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tag, setTag] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isEntertainment = selectedCategory?.name === "娯楽費";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || !categoryId || !amount) return;

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setSubmitting(true);

    await addTransaction({
      monthlyBudgetId: budget.id,
      date,
      amount: numAmount,
      categoryId,
      tag: isEntertainment && tag ? tag : undefined,
      memo: memo || undefined,
      type: "expense",
    });

    setSuccess(true);
    setAmount("");
    setTag("");
    setMemo("");

    setTimeout(() => {
      setSuccess(false);
    }, 2000);

    setSubmitting(false);
  };

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-white text-xl font-bold mb-6 text-center">
        支出を登録
      </h1>

      {success && (
        <div className="bg-green-900/50 text-green-400 text-center py-3 rounded-xl mb-4">
          登録しました
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-gray-400 text-sm block mb-2">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">金額</label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-800 text-white text-2xl rounded-xl px-4 py-3 border border-gray-700 focus:border-orange-500 focus:outline-none pr-10"
              required
              min="1"
              step="1"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              円
            </span>
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">
            カテゴリ
          </label>
          <div className="grid grid-cols-2 gap-2">
            {variableCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryId(cat.id);
                  if (cat.name !== "娯楽費") setTag("");
                }}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition ${
                  categoryId === cat.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-800 text-gray-300 border border-gray-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isEntertainment && (
          <div>
            <label className="text-gray-400 text-sm block mb-2">
              タグ（任意）
            </label>
            <div className="flex flex-wrap gap-2">
              {ENTERTAINMENT_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(tag === t ? "" : t)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition ${
                    tag === t
                      ? "bg-blue-500 text-white"
                      : "bg-gray-800 text-gray-300 border border-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-gray-400 text-sm block mb-2">
            メモ（任意）
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例：新宿ランチ"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !categoryId || !amount}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 active:bg-orange-600 transition"
        >
          支出を登録する
        </button>
      </form>
    </div>
  );
}
