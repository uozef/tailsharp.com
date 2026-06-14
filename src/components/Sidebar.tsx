"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Wallet,
  ShieldAlert,
  Radio,
  User,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover Leaders", icon: Compass },
  { href: "/portfolio", label: "My Portfolio", icon: Briefcase },
  { href: "/account", label: "Account & Wallet", icon: Wallet },
  { href: "/risk", label: "Risk Monitor", icon: ShieldAlert },
  { href: "/live", label: "Live Data", icon: Radio },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-700/50 bg-[#0f172a] transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Top: Logo + Toggle */}
      <div className={`flex items-center ${collapsed ? "justify-center px-0 py-5" : "gap-3 px-6 py-6"}`}>
        {!collapsed && (
          <Image src="/tailsharp-icon.svg" alt="TailSharp" width={40} height={40} className="rounded-xl" />
        )}
        {!collapsed && (
          <div className="flex flex-1 flex-col">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-blue-400">TAIL</span>
              <span className="text-amber-400">SHARP</span>
            </span>
            <span className="text-[10px] font-medium tracking-[0.2em] text-slate-500">
              FOLLOW THE SIGNAL
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`mt-4 flex flex-1 flex-col gap-1 ${collapsed ? "items-center px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-xl transition-colors ${
                collapsed
                  ? `h-11 w-11 justify-center ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  : `gap-3 px-4 py-3 text-sm font-medium ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={`border-t border-slate-700/50 ${collapsed ? "flex flex-col items-center gap-3 py-4" : "px-4 py-4"}`}>
        {collapsed ? (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-blue-400">
              <User className="h-4 w-4" />
            </div>
            <ThemeToggle className="text-slate-500 hover:!bg-slate-800" />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-blue-400">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-slate-200">My Account</span>
              <span className="flex items-center gap-1.5 text-xs text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Connected
              </span>
            </div>
            <ThemeToggle className="text-slate-500 hover:!bg-slate-800" />
          </div>
        )}
      </div>
    </aside>
  );
}
