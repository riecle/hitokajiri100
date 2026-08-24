"use client";

import { useState } from "react";
import { useDebts, useAllDebtPayments } from "@/lib/hooks";
import {
  totalDebt,
  simulateTotalPayoff,
  simulatePayoff,
  principalReduction,
} from "@/lib/calculations/debt";
import { addDebtPayment } from "@/db/repository";
import { formatMoney } from "@/lib/formatMoney";
import { formatDateKey, tokyoToday } from "@/lib/date";
import { format } from "date-fns";
import type { Debt } from "@/types/budget";

export default function DebtPage() {
  const debts = useDebts();
  const payments = useAllDebtPayments();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState("");
  const [paymentDate, setPaymentDate] = useState(formatDateKey(tokyoToday()));
  const [paymentAmount, setPaymentAmount] = useState("");
  const [balanceAfter, setBalanceAfter] = useState("");
  const [paymentMemo, setPaymentMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [additionalPayment, setAdditionalPayment] = useState(0);
  const [showSim, setShowSim] = useState(false);

  const today = tokyoToday();
  const total = totalDebt(debts);
  const payoff = simulateTotalPayoff(debts, today);
  const payoffWithExtra =
    additionalPayment > 0
      ? simulateTotalPayoff(debts, today, additionalPayment)
      : null;

  const allPaid = total === 0;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtId || !paymentAmount || !balanceAfter) return;

    const debt = debts.find((d) => d.id === selectedDebtId);
    if (!debt) return;

    const amount = parseInt(paymentAmount, 10);
    const after = parseInt(balanceAfter, 10);
    if (isNaN(amount) || isNaN(after) || amount <= 0 || after < 0) return;

    setSubmitting(true);

    const { principal, interestAndFees } = principalReduction(
      amount,
      debt.currentBalance,
      after
    );

    await addDebtPayment({
      debtId: selectedDebtId,
      date: paymentDate,
      paymentAmount: amount,
      balanceBefore: debt.currentBalance,
      balanceAfter: after,
      principalReduction: principal,
      interestAndFees,
      memo: paymentMemo || undefined,
    });

    setShowPaymentForm(false);
    setPaymentAmount("");
    setBalanceAfter("");
    setPaymentMemo("");
    setSubmitting(false);
  };

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 pb-4">
        {allPaid ? (
          <div className="bg-green-900/30 rounded-2xl p-8 text-center mb-4">
            <p className="text-green-400 text-4xl font-extrabold mb-2">
              借金完済
            </p>
            <p className="text-green-400 text-6xl font-extrabold">0円</p>
            <p className="text-green-300 text-lg mt-4">完済しました！</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-2xl p-6 text-center mb-4">
              <p className="text-gray-400 text-sm mb-1">借金完済まで</p>
              {payoff ? (
                <>
                  <p className="text-red-400 text-5xl font-extrabold">
                    あと {payoff.totalDays.toLocaleString()}日
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    完済予定日{" "}
                    {format(payoff.payoffDate, "yyyy年M月d日")}
                  </p>
                </>
              ) : (
                <p className="text-red-400 text-lg">
                  現在の返済額では完済できません
                </p>
              )}
              <p className="text-gray-600 text-[10px] mt-3">
                完済日は現在の残高・金利・返済設定から計算した予測です。
              </p>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 text-center mb-4">
              <p className="text-gray-400 text-sm mb-1">現在の借金</p>
              <p className="text-red-400 text-4xl font-extrabold">
                {formatMoney(total)}
                <span className="text-lg ml-1">円</span>
              </p>
            </div>
          </>
        )}

        {debts.map((debt) => (
          <DebtCard key={debt.id} debt={debt} today={today} />
        ))}

        <button
          onClick={() => {
            setShowPaymentForm(true);
            if (debts.length > 0 && !selectedDebtId) {
              setSelectedDebtId(debts[0].id);
            }
          }}
          className="w-full bg-red-600 text-white font-bold py-4 rounded-xl mt-4 active:bg-red-700 transition"
        >
          ＋ 返済を登録
        </button>

        {showPaymentForm && (
          <div className="bg-gray-800 rounded-2xl p-4 mt-4">
            <h3 className="text-white font-bold mb-4">返済登録</h3>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  借金
                </label>
                <select
                  value={selectedDebtId}
                  onChange={(e) => setSelectedDebtId(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 border border-gray-600"
                >
                  {debts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  返済日
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 border border-gray-600"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  支払額
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 border border-gray-600"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  支払い後実残高
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={balanceAfter}
                  onChange={(e) => setBalanceAfter(e.target.value)}
                  placeholder="金融会社で確認した残高"
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 border border-gray-600"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  メモ（任意）
                </label>
                <input
                  type="text"
                  value={paymentMemo}
                  onChange={(e) => setPaymentMemo(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 border border-gray-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  登録
                </button>
              </div>
            </form>
          </div>
        )}

        {!allPaid && (
          <div className="bg-gray-800 rounded-2xl p-4 mt-4">
            <button
              onClick={() => setShowSim(!showSim)}
              className="text-gray-300 font-medium text-sm w-full text-left"
            >
              {showSim ? "▼" : "▶"} 返済シミュレーション
            </button>
            {showSim && (
              <div className="mt-4 space-y-3">
                <p className="text-gray-400 text-sm">
                  毎月あといくら多く返したら？
                </p>
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={5000}
                  value={additionalPayment}
                  onChange={(e) =>
                    setAdditionalPayment(parseInt(e.target.value, 10))
                  }
                  className="w-full accent-orange-500"
                />
                <p className="text-orange-400 font-bold text-center">
                  +{formatMoney(additionalPayment)}円 / 月
                </p>

                {additionalPayment > 0 && payoff && payoffWithExtra && (
                  <div className="bg-gray-700 rounded-xl p-4 text-center space-y-2">
                    <p className="text-gray-400 text-sm">
                      現在: あと {payoff.totalDays.toLocaleString()}日
                    </p>
                    <p className="text-2xl">↓</p>
                    <p className="text-green-400 font-bold">
                      あと {payoffWithExtra.totalDays.toLocaleString()}日
                    </p>
                    <p className="text-yellow-400 text-sm font-medium">
                      {(
                        payoff.totalDays - payoffWithExtra.totalDays
                      ).toLocaleString()}
                      日短縮
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {sortedPayments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-gray-400 text-sm font-medium mb-3">
              返済履歴
            </h3>
            <div className="bg-gray-800 rounded-2xl overflow-hidden">
              {sortedPayments.map((p, i) => {
                const debt = debts.find((d) => d.id === p.debtId);
                return (
                  <div
                    key={p.id}
                    className={`px-4 py-3 ${
                      i < sortedPayments.length - 1
                        ? "border-b border-gray-700"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400 text-xs">
                        {format(new Date(p.date), "yyyy/MM/dd")}
                      </span>
                      <span className="text-gray-300 text-xs">
                        {debt?.name ?? "不明"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <span>
                          元金 {formatMoney(p.principalReduction)}円
                        </span>
                        <span className="ml-2">
                          利息等 {formatMoney(p.interestAndFees)}円
                        </span>
                      </div>
                      <span className="text-red-400 font-bold">
                        {formatMoney(p.paymentAmount)}円
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DebtCard({ debt, today }: { debt: Debt; today: Date }) {
  const payoff = simulatePayoff(
    debt.currentBalance,
    debt.annualInterestRate,
    debt.monthlyPayment,
    debt.paymentDay,
    today
  );

  return (
    <div className="bg-gray-800 rounded-2xl p-4 mb-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-bold">{debt.name}</h3>
        {debt.currentBalance === 0 && (
          <span className="text-green-400 text-xs font-medium">完済</span>
        )}
      </div>
      <p className="text-red-400 text-2xl font-extrabold mb-2">
        {formatMoney(debt.currentBalance)}
        <span className="text-sm ml-1">円</span>
      </p>
      <div className="flex gap-4 text-xs text-gray-500">
        <span>毎月返済 {formatMoney(debt.monthlyPayment)}円</span>
        <span>年利 {(debt.annualInterestRate * 100).toFixed(0)}%</span>
      </div>
      {payoff && debt.currentBalance > 0 && (
        <p className="text-gray-500 text-xs mt-1">
          完済まで約{payoff.totalDays.toLocaleString()}日
        </p>
      )}
    </div>
  );
}
