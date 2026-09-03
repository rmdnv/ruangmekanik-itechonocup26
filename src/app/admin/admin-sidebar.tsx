"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Award,
  Flag,
  FileText,
  ShieldCheck,
  ArrowLeft,
  X,
  Settings,
  LogOut,
  UserRound,
} from "lucide-react";

export function AdminSidebar({
  openReportsCount,
  mobileOpen,
  setMobileOpen,
  collapsed,
}: {
  openReportsCount: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/titles", label: "Titles", icon: Award },
    { href: "/admin/laporan", label: "Reports", icon: Flag, badge: openReportsCount },
    { href: "/admin/content", label: "Content", icon: FileText },
    { href: "/admin/security", label: "Security & Logs", icon: ShieldCheck },
  ];

  const renderContent = (isCollapsed: boolean) => (
    <div className={`flex h-full flex-col justify-between bg-zinc-950 text-white select-none transition-[width] duration-200 ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}>
      <div className="space-y-5 p-4">
        <div className={`flex items-center gap-3 pt-1 ${isCollapsed ? "justify-end" : "justify-between"}`}>
          {!isCollapsed ? (
            <Link href="/admin" className="flex items-center gap-2.5 group" title="Dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="RuangMekanik" className="h-16 w-16 rounded-xl object-contain shadow-md brightness-0 invert group-hover:scale-105 transition-transform" />
              <div className="leading-tight">
                <p className="text-sm font-extrabold tracking-tight text-white">RuangMekanik</p>
              </div>
            </Link>
          ) : (
            <Link href="/admin" className="flex items-center justify-center group" title="Dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="RM" className="h-16 w-16 rounded-xl object-contain shadow-md brightness-0 invert group-hover:scale-105 transition-transform" />
            </Link>
          )}

          <div className={`flex items-center gap-1 shrink-0 ${isCollapsed ? "ml-0" : "ml-auto"}`}>
            {/* <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={`hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors ${collapsed ? "mx-auto" : ""}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button> */}

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="h-px bg-zinc-800/80" />

        <nav className="space-y-1.5">
          {!isCollapsed && <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-mono">Menu Utama</p>}
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-white text-zinc-950 shadow-sm font-bold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {isCollapsed ? (
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-zinc-950" : "text-zinc-400"}`} />
                    {typeof item.badge === "number" && item.badge > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-zinc-950">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3.5 py-2.5">
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-zinc-950" : "text-zinc-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.badge === "number" && item.badge > 0 && (
                  <span
                    className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      active ? "bg-red-600 text-white" : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
        <div className="space-y-3 border-t border-zinc-800/80 p-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className={`flex w-full items-center rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors ${isCollapsed ? "h-11 justify-center" : "px-3 py-2.5 justify-between"}`}
              aria-label="Account menu"
            >
              <span className={`inline-flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
                <UserRound className="h-3.5 w-3.5" />
                {!isCollapsed && "Account"}
              </span>
              {!isCollapsed && <span className="text-[10px] font-mono text-zinc-500">•••</span>}
            </button>

            {accountOpen && (
              <div className={`absolute bottom-full left-0 mb-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl ${isCollapsed ? "w-44" : "w-full"}`}>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>

          <Link
            href="/"
            className={`flex ${isCollapsed ? "h-11 w-11 items-center justify-center mx-auto" : "w-full items-center justify-center gap-2 px-3 py-2.5"} rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors`}
            title="Kembali ke Situs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {!isCollapsed && <span>Kembali ke Situs</span>}
          </Link>
        </div>
      </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:border-r lg:border-zinc-800 overflow-hidden ${collapsed ? "lg:w-20" : "lg:w-64"}`}>
        {renderContent(collapsed)}
      </aside>

      {/* Mobile Slide-over Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-full shadow-2xl">
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
