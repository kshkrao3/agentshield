"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { LayoutDashboard, Users, Building2, TrendingUp, Zap, ArrowLeft } from "lucide-react";
import { LogoIcon } from "@/components/logo";

interface NavItem {
  href: Route;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin" as Route, label: "Overview", icon: <LayoutDashboard size={16} /> },
  { href: "/admin/users" as Route, label: "Users", icon: <Users size={16} /> },
  { href: "/admin/orgs" as Route, label: "Orgs & Billing", icon: <Building2 size={16} /> },
  { href: "/admin/usage" as Route, label: "Usage", icon: <TrendingUp size={16} /> },
  { href: "/admin/events" as Route, label: "Events", icon: <Zap size={16} /> },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 flex-shrink-0 h-full bg-[#0a0f1a] flex flex-col">
      {/* Logo + Admin badge */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <LogoIcon size={22} />
          <div>
            <span className="text-white text-sm font-semibold">AgentShield</span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              ADMIN
            </span>
          </div>
        </div>
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
      </nav>

      {/* Bottom — back to app */}
      <div className="px-4 py-4 border-t border-white/5">
        <Link
          href={"/dashboard" as Route}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to App
        </Link>
      </div>
    </aside>
  );
}
