export function formatMoney(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("ja-JP");
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

export function formatMoneyWithUnit(amount: number): string {
  return `${formatMoney(amount)}円`;
}
