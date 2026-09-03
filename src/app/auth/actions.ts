"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { findAvailableUsername, slugifyUsername } from "@/lib/username";
import { sendResetCode, sendSignupCode, verifyOtp, createPasswordResetToken, consumePasswordResetToken } from "@/lib/verification";
import { verifyTurnstileToken } from "@/lib/turnstile";

const usernameSchema = z
  .string()
  .min(3, "Username minimal 3 karakter")
  .max(20, "Username maksimal 20 karakter")
  .regex(/^[a-z0-9_-]+$/, "Username hanya huruf kecil, angka, tanda strip (_ -)")
  .optional()
  .or(z.literal(""));

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .regex(/[A-Za-z]/, "Kata sandi harus mengandung huruf")
    .regex(/[0-9]/, "Kata sandi harus mengandung angka"),
  username: usernameSchema,
});

const resetSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .regex(/[A-Za-z]/, "Kata sandi harus mengandung huruf")
    .regex(/[0-9]/, "Kata sandi harus mengandung angka"),
  confirmPassword: z.string(),
});

export interface RegisterResult {
  success: boolean;
  error?: string;
  email?: string;
  pending?: boolean; // account already exists but email not yet verified -> go to verify page
}

export async function registerAccount(formData: FormData): Promise<RegisterResult> {
  try {
    const turnstileToken = String(formData.get("turnstileToken") ?? "").trim();
    const captcha = await verifyTurnstileToken(turnstileToken);
    if (!captcha.success) return { success: false, error: captcha.error || "Verifikasi keamanan gagal" };

    const rawUsername = String(formData.get("username") ?? "").trim().toLowerCase();

    const rawData = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      password: String(formData.get("password") ?? ""),
      username: rawUsername,
    };

    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" };
    }

    const { name, email, password, username } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return { success: false, error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk." };
      }
      // Pending verification -> resend the code and route to the verify page.
      await sendSignupCode(existingUser.id, email);
      return { success: true, email, pending: true };
    }

    const resolvedUsername = username
      ? (await findAvailableUsername(username)) ?? `${slugifyUsername(username)}-${Date.now().toString(36).slice(-4)}`
      : (await findAvailableUsername(name))!;

    const hashedPassword = await bcrypt.hash(password, 10);

    let created;
    try {
      created = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          username: resolvedUsername,
          role: "user",
          emailVerified: null,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
        return { success: false, error: "Username sudah dipakai orang lain. Silakan pilih username lain." };
      }
      throw error;
    }

    await sendSignupCode(created.id, email);

    return { success: true, email };
  } catch (error) {
    console.error("Registration Error:", error);
    return { success: false, error: "Terjadi kesalahan sistem saat mendaftar" };
  }
}

export interface VerifySignupResult {
  success: boolean;
  error?: string;
  email?: string;
}

export async function requestSignupVerification(
  prev: VerifySignupResult | null,
  formData: FormData
): Promise<VerifySignupResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { success: false, error: "Email wajib diisi." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: false, error: "Email belum terdaftar. Silakan daftar terlebih dahulu." };
  if (user.emailVerified) return { success: false, error: "Email sudah terverifikasi. Silakan langsung masuk." };
  if (!user.password) return { success: false, error: "Akun ini tidak perlu verifikasi email." };

  await sendSignupCode(user.id, email);
  return { success: true, email };
}

export async function verifySignup(
  prev: VerifySignupResult | null,
  formData: FormData
): Promise<VerifySignupResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: false, error: "Email belum terdaftar." };
  if (user.emailVerified) return { success: false, error: "Email sudah terverifikasi." };

  const result = await verifyOtp(user.id, "signup", code);
  if (!result.ok) return { success: false, error: result.error };

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  return { success: true, email };
}

export interface ResetRequestResult {
  success: boolean;
  error?: string;
  resendAfterMs?: number;
}

export async function requestPasswordReset(
  _prev: ResetRequestResult | null,
  formData: FormData
): Promise<ResetRequestResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { success: false, error: "Email wajib diisi." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.password) {
    const sent = await sendResetCode(user.id, email);
    if (!sent.ok) {
      return { success: false, error: sent.error, resendAfterMs: 5 * 60 * 1000 };
    }
  }
  return { success: true };
}

export interface VerifyResetResult {
  success: boolean;
  error?: string;
  email?: string;
  token?: string;
}

export async function verifyResetCode(
  _prev: VerifyResetResult | null,
  formData: FormData
): Promise<VerifyResetResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return { success: false, error: "Akun dengan email ini tidak dapat direset." };
  }

  const result = await verifyOtp(user.id, "reset", code);
  if (!result.ok) return { success: false, error: result.error };

  const token = await createPasswordResetToken(user.id);
  return { success: true, email, token };
}

export interface ResetResult {
  success: boolean;
  error?: string;
  email?: string;
}

export async function resetPassword(
  _prev: ResetResult | null,
  formData: FormData
): Promise<ResetResult> {
  const rawData = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    token: String(formData.get("token") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = resetSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" };
  }

  const { email, password, confirmPassword } = parsed.data;
  if (password !== confirmPassword) {
    return { success: false, error: "Konfirmasi kata sandi tidak cocok." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return { success: false, error: "Akun dengan email ini tidak dapat direset." };
  }

  // The OTP was already confirmed at /auth/forgot step 2; this token authorizes the reset once.
  const verifiedUserId = await consumePasswordResetToken(rawData.token);
  if (!verifiedUserId || verifiedUserId !== user.id) {
    return { success: false, error: "Sesi reset tidak valid atau sudah kedaluwarsa. Silakan ulangi." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, emailVerified: new Date() },
    }),
    // Revoke all existing sessions so a leaked session cannot persist.
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return { success: true, email };
}
