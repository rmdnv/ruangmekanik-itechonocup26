"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Flag, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export function AdminHeader({
  setMobileOpen,
  openReportsCount,
  collapsed,
  setCollapsed,
}: {
  setMobileOpen: (open: boolean) => void;
  openReportsCount: number;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();

  const getBreadcrumb = () => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname.startsWith("/admin/users")) return "Users";
    if (pathname.startsWith("/admin/titles")) return "Titles";
    if (pathname.startsWith("/admin/laporan")) return "Reports";
    if (pathname.startsWith("/admin/content")) return "Content";
    if (pathname.startsWith("/admin/security")) return "Security & Logs";
    return "Admin";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-400">Admin</span>
          <span className="text-zinc-300">/</span>
          <span className="font-bold text-zinc-950">{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {openReportsCount > 0 && (
          <Link
            href="/admin/laporan"
            className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>{openReportsCount} Laporan Pending</span>
          </Link>
        )}
      </div>
    </header>
  );
}
