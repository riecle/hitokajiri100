"use client";

import { useMonth } from "./Providers";
import { formatYearMonth } from "@/lib/date";

export default function MonthSelector() {
  const { year, month, goToPrevMonth, goToNextMonth } = useMonth();

  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <button
        onClick={goToPrevMonth}
        className="text-gray-400 text-2xl px-3 py-1 active:text-white"
        aria-label="前月"
      >
        ‹
      </button>
      <h2 className="text-lg font-bold text-white">
        {formatYearMonth(year, month)}
      </h2>
      <button
        onClick={goToNextMonth}
        className="text-gray-400 text-2xl px-3 py-1 active:text-white"
        aria-label="翌月"
      >
        ›
      </button>
    </div>
  );
}
