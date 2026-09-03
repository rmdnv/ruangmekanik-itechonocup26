"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerAccount } from "@/app/auth/actions";
import { UserPlus, LogIn, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { getClientEnv } from "@/lib/env";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  const env = getClientEnv();
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    setTurnstileError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("turnstileToken", turnstileToken);

    if (mode === "signup") {
      const res = await registerAccount(formData);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Gagal membuat akun");
      } else {
        const email = res.email || String(formData.get("email") ?? "").trim();
        setSuccess("Akun berhasil dibuat! Silakan verifikasi email Anda.");
        router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
        router.refresh();
      }
    } else {
      const email = String(formData.get("email"));
      const password = String(formData.get("password"));

      const res = await signIn("credentials", {
        email,
        password,
        turnstileToken,
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        setError("Email atau kata sandi tidak sesuai");
      } else {
        router.push("/");
        router.refresh();
      }
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="w-full space-y-5">
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 border border-zinc-200 rounded-xl p-1.5">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
            setSuccess(null);
          }}
          className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
            mode === "signin"
              ? "bg-white text-zinc-950 shadow-sm border border-zinc-200"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
            setSuccess(null);
          }}
          className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
            mode === "signup"
              ? "bg-white text-zinc-950 shadow-sm border border-zinc-200"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          Daftar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 border border-red-200 bg-red-50 p-3.5 rounded-xl text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 border border-emerald-200 bg-emerald-50 p-3.5 rounded-xl text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {turnstileError && (
        <div className="flex items-center gap-2.5 border border-amber-200 bg-amber-50 p-3.5 rounded-xl text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{turnstileError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Nama Lengkap</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Budi Santoso"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Alamat Email</label>
          <input
            type="email"
            name="email"
            required
            placeholder="nama@email.com"
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Kata Sandi</label>
            {mode === "signin" && (
              <a href="/auth/forgot" className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-950 hover:underline">
                Lupa kata sandi?
              </a>
            )}
          </div>
          <input
            type="password"
            name="password"
            required
            placeholder="Minimal 8 karakter"
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
          />
        </div>

      {siteKey && (
        <div className="flex justify-center pt-2">
          <Turnstile
            siteKey={siteKey}
            onSuccess={(token) => {
              setTurnstileToken(token);
              setTurnstileError(null);
            }}
            onError={() => {
              setTurnstileToken("");
              setTurnstileError("Verifikasi keamanan gagal. Coba lagi.");
            }}
            onExpire={() => setTurnstileToken("")}
          />
        </div>
      )}

        <button
          type="submit"
          disabled={loading || (!!siteKey && !turnstileToken)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
            </>
          ) : mode === "signin" ? (
            <>
              <LogIn className="h-4 w-4" /> Masuk ke Akun
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Daftarkan Saya
            </>
          )}
        </button>
      </form>

      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <span className="relative bg-white px-3 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
          atau
        </span>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white py-3.5 text-xs font-bold tracking-wide text-zinc-900 transition hover:border-zinc-950 hover:bg-zinc-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Lanjutkan dengan Google</span>
      </button>
    </div>
  );
}
