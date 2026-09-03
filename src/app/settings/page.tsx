import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";
import { syncDeviceSession } from "@/lib/device-session";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin");

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) redirect("/auth/signin");

  // Record the current device so it shows up in the active-devices list.
  if (session.user.sessionId) {
    try {
      await syncDeviceSession(me.id, session.user.sessionId);
    } catch (error) {
      console.error("Device session sync failed", error);
    }
  }

  const sessions = await prisma.deviceSession.findMany({
    where: { userId: me.id, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
  });

  const currentSessionId = session.user.sessionId ?? null;
  const isOAuth = !me.password;

  return (
    <SettingsClient
      email={me.email ?? session.user.email ?? ""}
      isOAuth={isOAuth}
      currentSessionId={currentSessionId}
      sessions={sessions.map((s) => ({
        id: s.id,
        sessionId: s.sessionId,
        device: s.device,
        os: s.os,
        browser: s.browser,
        ip: s.ip,
        city: s.city,
        region: s.region,
        country: s.country,
        lastSeenAt: s.lastSeenAt.toISOString(),
      }))}
    />
  );
}
