"use client";

import { formatMoney } from "@/lib/formatMoney";
import { usagePercent, usageLevel } from "@/lib/calculations/budget";

interface CategoryProgressProps {
  name: string;
  actual: number;
  budget: number;
}

const LEVEL_COLORS = {
  normal: "bg-green-500",
  caution: "bg-yellow-500",
  warning: "bg-orange-500",
  danger: "bg-red-500",
};

const LEVEL_TEXT = {
  normal: "text-green-400",
  caution: "text-yellow-400",
  warning: "text-orange-400",
  danger: "text-red-400",
};

export default function CategoryProgress({
  name,
  actual,
  budget,
}: CategoryProgressProps) {
  const percent = usagePercent(actual, budget);
  const level = usageLevel(percent);
  const remaining = budget - actual;
  const barWidth = Math.min(percent, 100);

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-gray-300 font-medium">{name}</span>
        <span className={`text-sm ${LEVEL_TEXT[level]}`}>
          {remaining >= 0
            ? `残り ${formatMoney(remaining)}円`
            : `${formatMoney(Math.abs(remaining))}円超過`}
        </span>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>{formatMoney(actual)}円</span>
        <span>/ {formatMoney(budget)}円</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${LEVEL_COLORS[level]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
