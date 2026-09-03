"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import type { ReactNode } from "react";

export default function AdminLayout({
  children,
  openReportsCount = 0,
}: {
  children: ReactNode;
  openReportsCount?: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.add("admin-shell");
    return () => {
      document.body.classList.remove("admin-shell");
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-950">
      <AdminSidebar
        openReportsCount={openReportsCount}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={sidebarCollapsed}
      />

      <div className={`flex min-h-screen flex-col transition-[padding-left] duration-200 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <AdminHeader
          setMobileOpen={setMobileOpen}
          openReportsCount={openReportsCount}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
