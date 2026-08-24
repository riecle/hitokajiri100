import Decimal from "decimal.js";
import type { Debt, Yen } from "@/types/budget";
import { isLeap, effectivePaymentDay } from "@/lib/date";

export function totalDebt(debts: Debt[]): Yen {
  return debts.reduce((sum, d) => sum + d.currentBalance, 0);
}

export function principalReduction(
  paymentAmount: Yen,
  balanceBefore: Yen,
  balanceAfter: Yen
): { principal: Yen; interestAndFees: Yen } {
  const principal = balanceBefore - balanceAfter;
  const interestAndFees = paymentAmount - principal;
  return { principal, interestAndFees };
}

interface PayoffResult {
  totalDays: number;
  payoffDate: Date;
}

export function simulatePayoff(
  balance: Yen,
  annualRate: number,
  monthlyPayment: Yen,
  paymentDay: number | undefined,
  startDate: Date = new Date(),
  additionalMonthly: Yen = 0
): PayoffResult | null {
  if (balance <= 0) {
    return { totalDays: 0, payoffDate: startDate };
  }

  const totalMonthlyPayment = monthlyPayment + additionalMonthly;
  if (totalMonthlyPayment <= 0) return null;

  let currentBalance = new Decimal(balance);
  const rate = new Decimal(annualRate);
  let currentDate = new Date(startDate);
  const maxIterations = 1200;

  for (let i = 0; i < maxIterations; i++) {
    let nextMonth = currentDate.getMonth() + 1;
    let nextYear = currentDate.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    const day = paymentDay
      ? effectivePaymentDay(paymentDay, nextYear, nextMonth + 1)
      : currentDate.getDate();

    const nextPaymentDate = new Date(nextYear, nextMonth, day);
    const daysDiff = Math.round(
      (nextPaymentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysInYear = isLeap(nextPaymentDate.getFullYear()) ? 366 : 365;
    const interest = currentBalance
      .times(rate)
      .dividedBy(daysInYear)
      .times(daysDiff);

    currentBalance = currentBalance.plus(interest);

    if (currentBalance.lte(totalMonthlyPayment)) {
      const finalDays = Math.round(
        (nextPaymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { totalDays: finalDays, payoffDate: nextPaymentDate };
    }

    currentBalance = currentBalance.minus(totalMonthlyPayment);
    currentDate = nextPaymentDate;
  }

  return null;
}

export function simulateTotalPayoff(
  debts: Debt[],
  startDate: Date = new Date(),
  additionalMonthly: Yen = 0
): PayoffResult | null {
  if (debts.length === 0) return { totalDays: 0, payoffDate: startDate };

  let latestDate = startDate;
  let maxDays = 0;

  for (const debt of debts) {
    if (debt.currentBalance <= 0) continue;

    const result = simulatePayoff(
      debt.currentBalance,
      debt.annualInterestRate,
      debt.monthlyPayment,
      debt.paymentDay,
      startDate,
      additionalMonthly
    );

    if (!result) return null;

    if (result.totalDays > maxDays) {
      maxDays = result.totalDays;
      latestDate = result.payoffDate;
    }
  }

  return { totalDays: maxDays, payoffDate: latestDate };
}

export function estimateInterest(
  balance: Yen,
  annualRate: number,
  days: number,
  year: number
): Yen {
  const daysInYear = isLeap(year) ? 366 : 365;
  const interest = new Decimal(balance)
    .times(annualRate)
    .dividedBy(daysInYear)
    .times(days);
  return Math.round(interest.toNumber());
}
