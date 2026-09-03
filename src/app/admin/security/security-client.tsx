"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRevokeUserSessions } from "@/app/admin/actions";
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  Monitor,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Globe2,
} from "lucide-react";

export interface GlobalSessionItem {
  id: string;
  sessionId: string;
  userId: string;
  ip: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  lastSeenAt: string;
  user: {
    name: string | null;
    username: string | null;
    email: string | null;
  };
}

export interface AuditLogItem {
  id: string;
  action: string;
  target: string | null;
  detail: string | null;
  createdAt: string;
  admin: {
    name: string | null;
    username: string | null;
  };
}

export function SecurityClient({
  sessions,
  auditLogs,
}: {
  sessions: GlobalSessionItem[];
  auditLogs: AuditLogItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"sessions" | "audit">("sessions");
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleForceLogoutUser = async (userId: string, username: string) => {
    if (!confirm(`Revoke all login sessions for @${username}?`)) return;
    setError(null);
    setRevokingUserId(userId);
    const res = await adminRevokeUserSessions(userId);
    setRevokingUserId(null);

    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setSuccess(`Login sessions for @${username} revoked.`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex gap-1 border-b border-zinc-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("sessions")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            tab === "sessions"
              ? "bg-zinc-950 text-white"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Active Sessions ({sessions.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("audit")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            tab === "audit"
              ? "bg-zinc-950 text-white"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {tab === "sessions" && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Device</th>
                  <th className="py-3.5 px-4">IP & Location</th>
                  <th className="py-3.5 px-4">Last Seen</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      No active sessions.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-950">
                        <div>
                          <p>{s.user.name || s.user.username}</p>
                          <p className="font-mono text-[11px] text-zinc-400 font-normal">@{s.user.username}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <DeviceIcon device={s.device} />
                          <div>
                            <p className="font-semibold text-zinc-900">{s.device || "Device"}</p>
                            <p className="text-[11px] text-zinc-500">{[s.browser, s.os].filter(Boolean).join(" · ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-mono text-[11px] text-zinc-700">{s.ip || "Unknown IP"}</p>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Globe2 className="h-3 w-3" />
                          {locationLabel(s)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                        {new Date(s.lastSeenAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={revokingUserId === s.userId}
                          onClick={() => handleForceLogoutUser(s.userId, s.user.username || "user")}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {revokingUserId === s.userId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <LogOut className="h-3.5 w-3.5" />
                              Revoke
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Admin</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      No admin logs yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-950">@{log.admin.username || log.admin.name || "admin"}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                        <span className="rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px]">{log.action}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">{log.target || "-"}</td>
                      <td className="py-3.5 px-4 text-zinc-600 max-w-xs truncate">{log.detail || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceIcon({ device }: { device: string | null }) {
  const d = (device || "").toLowerCase();
  if (d.includes("iphone") || d.includes("android") || d.includes("mobile") || d.includes("ponsel")) {
    return <Smartphone className="h-4 w-4 text-zinc-500" />;
  }
  if (d.includes("mac") || d.includes("ipad") || d.includes("tablet") || d.includes("laptop")) {
    return <Laptop className="h-4 w-4 text-zinc-500" />;
  }
  return <Monitor className="h-4 w-4 text-zinc-500" />;
}

function isLocalIp(ip: string | null): boolean {
  if (!ip) return false;
  return ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.");
}

function locationLabel(device: GlobalSessionItem): string {
  if (device.country && !isLocalIp(device.ip)) {
    return [device.city, device.region, device.country].filter(Boolean).join(", ");
  }
  return "Local";
}
