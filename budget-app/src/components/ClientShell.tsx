"use client";

import { MonthProvider } from "./Providers";
import BottomNavigation from "./BottomNavigation";
import { usePathname } from "next/navigation";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNav = pathname !== "/settings";

  return (
    <MonthProvider>
      <main className="max-w-lg mx-auto pb-20 min-h-screen">{children}</main>
      {showNav && <BottomNavigation />}
    </MonthProvider>
  );
}
