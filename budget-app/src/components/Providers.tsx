"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getOrCreateMonthlyBudget } from "@/db/repository";
import { tokyoToday } from "@/lib/date";
import type { MonthlyBudget } from "@/types/budget";

interface MonthContextValue {
  year: number;
  month: number;
  budget: MonthlyBudget | null;
  loading: boolean;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  refresh: () => void;
}

const MonthContext = createContext<MonthContextValue | null>(null);

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error("useMonth must be used inside MonthProvider");
  return ctx;
}

export function MonthProvider({ children }: { children: ReactNode }) {
  const today = tokyoToday();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrCreateMonthlyBudget(year, month).then((b) => {
      if (!cancelled) {
        setBudget(b);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [year, month, refreshKey]);

  const goToPrevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <MonthContext.Provider
      value={{ year, month, budget, loading, goToPrevMonth, goToNextMonth, refresh }}
    >
      {children}
    </MonthContext.Provider>
  );
}
