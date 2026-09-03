"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";
import { banUser } from "@/app/users/[username]/actions";

const MAX_REASON = 120;
const MAX_DETAIL = 1000;

export interface ReportActionResult {
  success: boolean;
  error?: string;
}

export async function createReport(
  reportedId: string,
  reason: string,
  detail: string,
  commentId?: string
): Promise<ReportActionResult> {
  const reporter = await requireCurrentUser();

  const cleanReason = reason.trim().slice(0, MAX_REASON);
  const cleanDetail = detail.trim().slice(0, MAX_DETAIL);

  if (!cleanReason) return { success: false, error: "Pilih alasan laporan terlebih dahulu" };
  if (cleanReason.length < 3) return { success: false, error: "Alasan laporan terlalu pendek" };
  if (cleanDetail.length > 0 && cleanDetail.length < 3) {
    return { success: false, error: "Keterangan tambahan terlalu pendek" };
  }

  if (reporter.id === reportedId) return { success: false, error: "Tidak dapat melaporkan diri sendiri" };

  const target = await prisma.user.findUnique({ where: { id: reportedId } });
  if (!target) return { success: false, error: "Pengguna tidak ditemukan" };

  if (commentId) {
    const comment = await prisma.diagnosticComment.findUnique({ where: { id: commentId } });
    if (!comment) return { success: false, error: "Tanggapan tidak ditemukan" };
  }

  const existing = await prisma.userReport.findFirst({
    where: { reporterId: reporter.id, reportedId, status: "open" },
  });
  if (existing) {
    return { success: false, error: "Kamu sudah melaporkan pengguna ini dan laporan sedang diproses" };
  }

  await prisma.userReport.create({
    data: {
      reporterId: reporter.id,
      reportedId,
      commentId: commentId || null,
      reason: cleanReason,
      detail: cleanDetail || null,
    },
  });

  revalidatePath("/admin/laporan");
  return { success: true };
}

export async function resolveReport(reportId: string): Promise<void> {
  const admin = await requireCurrentUser();
  if (admin.role !== "admin") throw new Error("Forbidden");

  const report = await prisma.userReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Not found");

  await prisma.userReport.update({
    where: { id: reportId },
    data: { status: "resolved", handledById: admin.id, handledAt: new Date() },
  });

  revalidatePath("/admin/laporan");
}

export async function banReportedUser(reportId: string): Promise<void> {
  const admin = await requireCurrentUser();
  if (admin.role !== "admin") throw new Error("Forbidden");

  const report = await prisma.userReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Not found");

  await banUser(report.reportedId, report.reason);
}