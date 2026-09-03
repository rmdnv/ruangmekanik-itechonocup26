"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/session";
import { createOtp, verifyOtp } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { syncDeviceSession } from "@/lib/device-session";

const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter")
  .regex(/[A-Za-z]/, "Kata sandi harus mengandung huruf")
  .regex(/[0-9]/, "Kata sandi harus mengandung angka");

export interface ActionResult {
  success: boolean;
  error?: string;
  email?: string;
}

/** Revalidate settings + profile caches after account mutations. */
function revalidateAccount() {
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function getAccountSessions() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { currentSessionId: null, sessions: [] };

  // Ensure the current request's device is recorded.
  await syncDeviceSession(userId, session.user?.sessionId);

  const sessions = await prisma.deviceSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
  });

  return { currentSessionId: session.user?.sessionId ?? null, sessions };
}

export async function changePassword(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireCurrentUser();
  if (!user.password) {
    return { success: false, error: "Akun ini masuk lewat Google, tidak memiliki kata sandi." };
  }

  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Kata sandi tidak valid" };
  if (password !== confirm) return { success: false, error: "Konfirmasi kata sandi tidak cocok." };

  const ok = await bcrypt.compare(current, user.password);
  if (!ok) return { success: false, error: "Kata sandi saat ini salah." };

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  revalidateAccount();
  return { success: true };
}

export async function requestEmailChange(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = z.string().email("Format email tidak valid").safeParse(email);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Email tidak valid" };

  if (email === (user.email ?? "").toLowerCase()) {
    return { success: false, error: "Email baru sama dengan email saat ini." };
  }

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) return { success: false, error: "Email tersebut sudah dipakai akun lain." };

  const result = await createOtp(user.id, "email");
  if (!result.ok) return { success: false, error: result.error || "Silakan coba lagi." };

  const sent = await sendVerificationEmail(email, result.verifyCode ?? "", "email");
  if (!sent) return { success: false, error: "Gagal mengirim email verifikasi. Coba lagi nanti." };

  return { success: true, email };
}

export async function confirmEmailChange(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireCurrentUser();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();

  if (!z.string().email().safeParse(email).success) {
    return { success: false, error: "Format email tidak valid." };
  }

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken && taken.id !== user.id) {
    return { success: false, error: "Email tersebut sudah dipakai akun lain." };
  }

  const result = await verifyOtp(user.id, "email", code);
  if (!result.ok) return { success: false, error: result.error };

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { email } }),
    // Revoke every device session so the user re-authenticates with the new email.
    prisma.deviceSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  revalidateAccount();
  return { success: true, email };
}

export async function revokeDeviceSession(sessionId: string): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const session = await auth();
  const current = session?.user?.sessionId;

  if (sessionId === current) {
    return { success: false, error: "Gunakan 'Keluar' untuk menutup perangkat ini." };
  }

  await prisma.deviceSession.updateMany({
    where: { sessionId, userId: user.id },
    data: { revokedAt: new Date() },
  });

  revalidateAccount();
  return { success: true };
}

export async function revokeAllOtherDevices(): Promise<ActionResult> {
  const user = await requireCurrentUser();
  const session = await auth();
  const current = session?.user?.sessionId ?? "__none__";

  await prisma.deviceSession.updateMany({
    where: { userId: user.id, revokedAt: null, sessionId: { not: current } },
    data: { revokedAt: new Date() },
  });

  revalidateAccount();
  return { success: true };
}
