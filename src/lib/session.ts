import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncDeviceSession } from "@/lib/device-session";

export async function requireCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Unauthorized");
  if (user.banned) throw new Error("Akun dibekukan");

  // Record/refresh the active device session for this request (throttled).
  if (session.user.sessionId) {
    try {
      await syncDeviceSession(user.id, session.user.sessionId);
    } catch (error) {
      console.error("Device session sync failed", error);
    }
  }

  return user;
}

export async function requireOwnerOrAdmin(ownerId: string) {
  const user = await requireCurrentUser();
  if (user.id !== ownerId && user.role !== "admin") throw new Error("Forbidden");
  return user;
}
