"use client";

import { usePathname } from "next/navigation";
import { Search, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/discover": "Discover Leaders",
  "/portfolio": "My Portfolio",
  "/account": "Account & Wallet",
  "/risk": "Risk Monitor",
  "/live": "Live Leaderboard",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/leader/")) return "Leader Profile";
  if (pathname.startsWith("/live/")) return "Wallet Activity";
  return "TailSharp";
}

export default function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-card-border bg-surface px-8">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-56 rounded-lg border border-card-border bg-background pl-9 pr-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-blue-400 focus:bg-surface focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-inset text-blue-400">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
