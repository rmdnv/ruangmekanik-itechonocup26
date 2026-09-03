import { createHash, randomBytes, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_ATTEMPTS = 5;

export type OTPType = "signup" | "reset" | "email";

function genCode(): string {
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i++) code += randomInt(0, 10).toString();
  return code;
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export interface OTPRecord {
  valid: boolean;
  expired?: boolean;
  locked?: boolean;
  reason?: "missing" | "expired" | "locked" | "not-found" | "verified";
  verifyCode?: string;
}

/** Create a fresh OTP for a user/type, invalidating previous unused ones of the same type. */
export async function createOtp(userId: string, type: OTPType): Promise<{ ok: boolean; resendAfterMs?: number; verifyCode?: string; error?: string }> {
  const now = new Date();
  const recent = await prisma.verificationCode.findFirst({
    where: { userId, type, usedAt: null, createdAt: { gte: new Date(now.getTime() - RESEND_COOLDOWN_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return { ok: false, resendAfterMs: RESEND_COOLDOWN_MS, error: "Kode baru dapat diminta sebentar lagi." };
  }

  // Invalidate previous unused codes of this type so only one is live.
  await prisma.verificationCode.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: now },
  });

  const code = genCode();
  await prisma.verificationCode.create({
    data: {
      userId,
      type,
      codeHash: hashCode(code),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
    },
  });
  return { ok: true, verifyCode: code };
}

/** Verify a submitted code against the latest live OTP of the given type. */
export async function verifyOtp(
  userId: string,
  type: OTPType,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date();
  const record = await prisma.verificationCode.findFirst({
    where: { userId, type, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false, error: "Kode tidak ditemukan. Silakan minta kode baru." };
  }
  if (record.expiresAt < now) {
    return { ok: false, error: "Kode sudah kedaluwarsa. Silakan minta kode baru." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Terlalu banyak percobaan. Silakan minta kode baru." };
  }

  if (hashCode(code.trim()) === record.codeHash) {
    await prisma.verificationCode.update({ where: { id: record.id }, data: { usedAt: now } });
    return { ok: true };
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  });
  const remaining = MAX_ATTEMPTS - (record.attempts + 1);
  return {
    ok: false,
    error: remaining > 0 ? `Kode salah. ${remaining} percobaan tersisa.` : "Terlalu banyak percobaan. Silakan minta kode baru.",
  };
}

export async function sendSignupCode(userId: string, email: string): Promise<void> {
  const result = await createOtp(userId, "signup");
  if (result.ok && result.verifyCode) {
    await sendVerificationEmail(email, result.verifyCode, "signup");
  }
}

export async function sendResetCode(userId: string, email: string): Promise<{ ok: boolean; error?: string }> {
  const result = await createOtp(userId, "reset");
  if (!result.ok) return { ok: false, error: result.error };
  if (result.verifyCode) {
    const sent = await sendVerificationEmail(email, result.verifyCode, "reset");
    if (!sent) return { ok: false, error: "Gagal mengirim email. Coba lagi nanti." };
  }
  return { ok: true };
}

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Mint a one-time, hashed password-reset token after a valid OTP is confirmed. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashCode(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  return token;
}

/** Consume a one-time reset token; returns the userId on success. */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashCode(token), usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt < new Date()) return null;
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
