import { prisma } from "@/lib/prisma";

export async function logAdminAction(
  adminId: string,
  action: string,
  target?: string | null,
  detail?: string | null
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        target: target || null,
        detail: detail || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
