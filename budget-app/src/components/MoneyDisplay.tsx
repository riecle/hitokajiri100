"use client";

import { formatMoney } from "@/lib/formatMoney";

interface MoneyDisplayProps {
  amount: number;
  size?: "xl" | "lg" | "md" | "sm";
  color?: "default" | "orange" | "blue" | "red" | "green";
  showUnit?: boolean;
  label?: string;
  sublabel?: string;
}

const SIZE_CLASSES = {
  xl: "text-5xl font-extrabold",
  lg: "text-3xl font-bold",
  md: "text-xl font-bold",
  sm: "text-lg font-semibold",
};

const COLOR_CLASSES = {
  default: "text-white",
  orange: "text-orange-400",
  blue: "text-blue-400",
  red: "text-red-500",
  green: "text-green-400",
};

export default function MoneyDisplay({
  amount,
  size = "md",
  color = "default",
  showUnit = true,
  label,
  sublabel,
}: MoneyDisplayProps) {
  const isNegative = amount < 0;
  const displayColor = isNegative ? "red" : color;

  return (
    <div className="text-center">
      {label && (
        <p className="text-gray-400 text-sm mb-1">{label}</p>
      )}
      <p className={`${SIZE_CLASSES[size]} ${COLOR_CLASSES[displayColor]}`}>
        {isNegative && "-"}
        {formatMoney(Math.abs(amount))}
        {showUnit && <span className="text-[0.5em] ml-1">円</span>}
      </p>
      {sublabel && (
        <p className="text-gray-500 text-xs mt-1">{sublabel}</p>
      )}
    </div>
  );
}
