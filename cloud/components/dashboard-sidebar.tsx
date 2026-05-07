"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { LayoutGrid, Zap, BarChart3, Bell, Settings, Shield } from "lucide-react";
import { LogoFull } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";

interface NavItem {
  href: Route;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard" as Route, label: "Projects", icon: <LayoutGrid size={16} /> },
  { href: "/dashboard/events" as Route, label: "Events", icon: <Zap size={16} /> },
  { href: "/dashboard/analytics" as Route, label: "Analytics", icon: <BarChart3 size={16} /> },
  { href: "/dashboard/alerts" as Route, label: "Alerts", icon: <Bell size={16} /> },
  { href: "/dashboard/settings" as Route, label: "Settings", icon: <Settings size={16} /> },
];

interface Props {
  orgName: string;
  plan: string;
  userEmail: string;
  isAdmin?: boolean;
}

export function DashboardSidebar({ orgName, plan, userEmail, isAdmin }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 flex-shrink-0 h-full bg-[#0a0f1a] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <LogoFull size={22} dark className="text-white text-sm" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                active
                  ? "text-green-400 bg-green-400/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-green-400 rounded-r-full" />
              )}
              <span className={active ? "text-green-400" : "text-slate-500"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href={"/admin" as Route}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all mt-2"
          >
            <Shield size={16} />
            Admin
          </Link>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{orgName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <span className="ml-2 shrink-0 text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
            {plan}
          </span>
        </div>
        <div className="text-xs">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
