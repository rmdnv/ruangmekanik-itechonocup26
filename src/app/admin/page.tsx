import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Users,
  FileText,
  MessageSquare,
  Award,
  Flag,
  TrendingUp,
  ArrowRight,
  UserCheck,
  Eye,
  Activity,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const [
    usersCount,
    bannedUsersCount,
    guidesCount,
    guidesViewsSum,
    diagnosticsCount,
    commentsCount,
    titlesCount,
    openReportsCount,
    recentUsers,
    popularGuides,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { banned: true } }),
    prisma.guide.count(),
    prisma.guide.aggregate({ _sum: { viewsCount: true } }),
    prisma.diagnostic.count(),
    prisma.diagnosticComment.count(),
    prisma.title.count(),
    prisma.userReport.count({ where: { status: "open" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, username: true, email: true, createdAt: true, banned: true, role: true },
    }),
    prisma.guide.findMany({
      orderBy: { viewsCount: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, viewsCount: true, author: { select: { name: true, username: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { admin: { select: { name: true, username: true } } },
    }),
  ]);

  const metrics = [
    {
      label: "Total Users",
      value: usersCount,
      sub: `${bannedUsersCount} Banned`,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Guides",
      value: guidesCount,
      sub: `${guidesViewsSum._sum.viewsCount ?? 0} Views`,
      icon: FileText,
      href: "/admin/content",
    },
    {
      label: "Diagnostics",
      value: diagnosticsCount,
      sub: `${commentsCount} Comments`,
      icon: MessageSquare,
      href: "/admin/content",
    },
    {
      label: "Pending Reports",
      value: openReportsCount,
      sub: openReportsCount > 0 ? "Requires action" : "Clean status",
      icon: Flag,
      href: "/admin/laporan",
      alert: openReportsCount > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">Dashboard Overview</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Real-time platform metrics, user growth, and moderation activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <UserCheck className="h-4 w-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              href={m.href}
              className={`group rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                m.alert
                  ? "border-red-300 bg-red-50/40 shadow-2xs hover:border-red-400"
                  : "border-zinc-200 bg-white shadow-2xs hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">{m.label}</span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                    m.alert
                      ? "bg-red-600 text-white"
                      : "bg-zinc-100 text-zinc-700 group-hover:bg-zinc-950 group-hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold font-mono text-zinc-950 tracking-tight">{m.value}</p>
                <p className="mt-0.5 text-xs text-zinc-500 font-medium">{m.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column (8 cols): Recent Users & Popular Guides */}
        <div className="lg:col-span-8 space-y-8">
          {/* Recent Users */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-bold text-zinc-950">Recent Users</h2>
              </div>
              <Link href="/admin/users" className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 inline-flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-zinc-950 truncate">{u.name || u.username}</p>
                    <p className="text-[11px] font-mono text-zinc-400 truncate">@{u.username || "no-username"} · {u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.role === "admin" && (
                      <span className="rounded-full bg-zinc-950 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        Admin
                      </span>
                    )}
                    {u.banned && (
                      <span className="rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                        Banned
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Guides */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-bold text-zinc-950">Top Technical Guides</h2>
              </div>
              <Link href="/admin/content" className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 inline-flex items-center gap-1">
                Manage Content <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {popularGuides.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0 space-y-0.5">
                    <Link href={`/guides/${g.slug}`} className="text-xs font-bold text-zinc-950 hover:underline truncate block">
                      {g.title}
                    </Link>
                    <p className="text-[11px] text-zinc-400 truncate">
                      by {g.author.name || g.author.username}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-[11px] font-mono font-semibold text-zinc-700 shrink-0">
                    <Eye className="h-3.5 w-3.5 text-zinc-400" />
                    {g.viewsCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (4 cols): Audit log & System Quick Access */}
        <div className="lg:col-span-4 space-y-8">
          {/* Audit Logs */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-bold text-zinc-950">Admin Activity</h2>
              </div>
              <Link href="/admin/security" className="text-xs font-semibold text-zinc-500 hover:text-zinc-950">
                View Logs
              </Link>
            </div>
            <div className="space-y-3">
              {recentAuditLogs.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">No recent admin logs.</p>
              ) : (
                recentAuditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-zinc-950">{log.action}</span>
                      <span className="text-zinc-400">
                        {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {log.detail && <p className="text-xs text-zinc-600 line-clamp-2">{log.detail}</p>}
                    <p className="text-[10px] text-zinc-400">by @{log.admin.username || log.admin.name}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Titles & Catalog Info Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <Award className="h-4 w-4 text-zinc-500" /> Titles Catalog
              </h2>
              <span className="font-mono text-xs font-bold text-zinc-950 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                {titlesCount}
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Standardized mechanic skill titles available for users to pick on their profile.
            </p>
            <Link
              href="/admin/titles"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
            >
              Manage Titles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
