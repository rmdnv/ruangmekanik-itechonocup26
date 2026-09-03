import { headers } from "next/headers";
import { getServerEnv } from "@/lib/env";

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify Cloudflare Turnstile token server-side.
 * In development, if secret is missing, allow through to avoid blocking local dev.
 */
export async function verifyTurnstileToken(token: string): Promise<TurnstileVerifyResult> {
  const env = getServerEnv();
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (env.NODE_ENV !== "production") {
      console.warn("TURNSTILE_SECRET_KEY missing; bypassing verification in dev.");
      return { success: true };
    }
    return { success: false, error: "Turnstile belum dikonfigurasi." };
  }

  if (!token) return { success: false, error: "Verifikasi keamanan belum selesai." };

  try {
    const hdrs = await headers();
    const remoteip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || undefined;

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteip) body.set("remoteip", remoteip);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) {
      return {
        success: false,
        error: data["error-codes"]?.[0] || "Verifikasi keamanan gagal.",
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Verifikasi keamanan gagal." };
  }
}
