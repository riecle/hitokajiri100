import {
  format,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isLeapYear,
} from "date-fns";

const TZ = "Asia/Tokyo";

export function tokyoToday(): Date {
  const now = new Date();
  const tokyo = new Date(
    now.toLocaleString("en-US", { timeZone: TZ })
  );
  tokyo.setHours(0, 0, 0, 0);
  return tokyo;
}

export function tokyoNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ })
  );
}

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function daysInMonth(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1));
}

export function remainingDaysInMonth(
  year: number,
  month: number,
  today: Date
): number {
  const totalDays = daysInMonth(year, month);
  const currentDay = today.getDate();
  if (today.getFullYear() !== year || today.getMonth() + 1 !== month) {
    if (
      today.getFullYear() > year ||
      (today.getFullYear() === year && today.getMonth() + 1 > month)
    ) {
      return 0;
    }
    return totalDays;
  }
  return totalDays - currentDay + 1;
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end });
}

export function getWeekdayIndex(date: Date): number {
  const d = getDay(date);
  return d === 0 ? 6 : d - 1;
}

export function isLeap(year: number): boolean {
  return isLeapYear(new Date(year, 0, 1));
}

export function effectivePaymentDay(
  paymentDay: number,
  year: number,
  month: number
): number {
  const days = daysInMonth(year, month);
  return Math.min(paymentDay, days);
}
