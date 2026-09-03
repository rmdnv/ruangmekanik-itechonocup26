import { prisma } from "@/lib/prisma";
import { SecurityClient, GlobalSessionItem, AuditLogItem } from "./security-client";

export default async function AdminSecurityPage() {
  const [dbSessions, dbLogs] = await Promise.all([
    prisma.deviceSession.findMany({
      where: { revokedAt: null },
      orderBy: { lastSeenAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        admin: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    }),
  ]);

  const sessions: GlobalSessionItem[] = dbSessions.map((s) => ({
    ...s,
    lastSeenAt: s.lastSeenAt.toISOString(),
  }));

  const auditLogs: AuditLogItem[] = dbLogs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">Security & Logs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pantau sesi login dan log aktivitas admin.
        </p>
      </div>

      <SecurityClient sessions={sessions} auditLogs={auditLogs} />
    </div>
  );
}
