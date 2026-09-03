import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { parseUserAgent } from "@/lib/device";
import { resolveGeo } from "@/lib/geo";

const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000; // update lastSeenAt at most once every 5 min

/**
 * Record or refresh a device session for the current request.
 * Runs in Node context (server action / RSC), where headers() + prisma + fetch work.
 * Throttled so frequent authenticated calls do not hammer the database or the
 * geolocation API.
 *
 * Returns the active DeviceSession id, or null if it could not be created.
 */
export async function syncDeviceSession(
  userId: string,
  sessionId: string | null | undefined
): Promise<string | null> {
  if (!sessionId) return null;
  if (!userId) return null;

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const ua = hdrs.get("user-agent");

  const trimmed = ua ? ua.slice(0, 400) : null;
  const { device, os, browser } = parseUserAgent(trimmed);

  const now = new Date();

  const existing = await prisma.deviceSession.findUnique({
    where: { sessionId },
  });

  // Already revoked -> this session should be treated as inactive; the JWT callback
  // regenerates a fresh sessionId for the next request, so leave this row alone.
  if (existing && existing.revokedAt) return existing.id;

  // Row already exists and was touched recently -> just bump lastSeenAt if due.
  if (existing) {
    const lastMs = existing.lastSeenAt.getTime();
    if (now.getTime() - lastMs < LAST_SEEN_THROTTLE_MS) return existing.id;
    await prisma.deviceSession.update({
      where: { sessionId },
      data: { ip: ip ?? existing.ip, lastSeenAt: now },
    });
    return existing.id;
  }

  const geo = await resolveGeo(ip);
  const created = await prisma.deviceSession.create({
    data: {
      sessionId,
      userId,
      ip,
      userAgent: trimmed,
      device,
      os,
      browser,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      lastSeenAt: now,
    },
  });
  return created.id;
}

function getClientIp(hdrs: Headers): string | null {
  const fwd = hdrs.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = hdrs.get("x-real-ip");
  if (real) return real.slice(0, 64);
  return null;
}
