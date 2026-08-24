"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/budget", label: "予算", icon: "💰" },
  { href: "/calendar", label: "カレンダー", icon: "📅" },
  { href: "/transactions/new", label: "＋", icon: "", isCenter: true },
  { href: "/monthly", label: "実績", icon: "📊" },
  { href: "/debt", label: "借金", icon: "💳" },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center w-14 h-14 -mt-4 rounded-full bg-orange-500 text-white text-2xl font-bold shadow-lg active:bg-orange-600"
              >
                ＋
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full text-xs ${
                isActive ? "text-orange-400" : "text-gray-400"
              }`}
            >
              <span className="text-lg mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
