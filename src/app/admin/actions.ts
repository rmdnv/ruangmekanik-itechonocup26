"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";
import { logAdminAction } from "@/lib/audit";

export interface AdminActionResult {
  success: boolean;
  error?: string;
}

async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.role !== "admin") throw new Error("Akses khusus admin");
  return user;
}

export async function adminToggleUserRole(targetUserId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return { success: false, error: "Pengguna tidak ditemukan" };

    if (target.id === admin.id) {
      return { success: false, error: "Tidak dapat mengubah peran akun Anda sendiri" };
    }

    const nextRole = target.role === "admin" ? "user" : "admin";
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: nextRole },
    });

    await logAdminAction(
      admin.id,
      nextRole === "admin" ? "PROMOTE_ADMIN" : "DEMOTE_USER",
      target.username || target.email || target.id,
      `Mengubah peran pengguna dari ${target.role} ke ${nextRole}`
    );

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    if (target.username) revalidatePath(`/users/${target.username}`);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengubah peran" };
  }
}

export async function adminRevokeUserSessions(targetUserId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return { success: false, error: "Pengguna tidak ditemukan" };

    const count = await prisma.deviceSession.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await logAdminAction(
      admin.id,
      "REVOKE_ALL_SESSIONS",
      target.username || target.email || target.id,
      `Mencabut ${count.count} sesi login aktif`
    );

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/admin/security");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mencabut sesi" };
  }
}

export async function adminDeleteTitle(titleId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();
    const title = await prisma.title.findUnique({ where: { id: titleId } });
    if (!title) return { success: false, error: "Gelar tidak ditemukan" };

    await prisma.title.delete({ where: { id: titleId } });

    await logAdminAction(
      admin.id,
      "DELETE_MASTER_TITLE",
      title.name,
      `Menghapus gelar master "${title.name}"`
    );

    revalidatePath("/admin/titles");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus gelar" };
  }
}

export async function adminDeleteGuide(guideId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();
    const guide = await prisma.guide.findUnique({
      where: { id: guideId },
      select: { title: true, slug: true },
    });
    if (!guide) return { success: false, error: "Panduan tidak ditemukan" };

    await prisma.guide.delete({ where: { id: guideId } });

    await logAdminAction(
      admin.id,
      "DELETE_GUIDE",
      guide.slug,
      `Menghapus panduan: "${guide.title}"`
    );

    revalidatePath("/admin/content");
    revalidatePath("/guides");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus panduan" };
  }
}

export async function adminDeleteDiagnostic(diagnosticId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();
    const diag = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      select: { title: true, slug: true },
    });
    if (!diag) return { success: false, error: "Diagnosa tidak ditemukan" };

    await prisma.diagnostic.delete({ where: { id: diagnosticId } });

    await logAdminAction(
      admin.id,
      "DELETE_DIAGNOSTIC",
      diag.slug,
      `Menghapus kasus diagnosa: "${diag.title}"`
    );

    revalidatePath("/admin/content");
    revalidatePath("/diagnostics");
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus diagnosa" };
  }
}
