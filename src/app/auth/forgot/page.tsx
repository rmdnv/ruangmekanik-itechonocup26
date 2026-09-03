"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { OtpInput } from "@/components/otp-input";
import {
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Wrench,
  KeyRound,
  ShieldCheck,
  Lock,
  MailCheck,
} from "lucide-react";

const RESEND_SECONDS = 5 * 60;

type Step = "email" | "code" | "password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [sendState, sendAction, sendPending] = useActionState(requestPasswordReset, null);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyResetCode, null);
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, null);
  const token = verifyState?.token ?? "";

  // The current step is derived from each action's result (forward-only wizard).
  const step: Step = resetState?.success
    ? "success"
    : verifyState?.success && verifyState.token
    ? "password"
    : sendState?.success
    ? "code"
    : "email";

  // countdown ticker for the resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const handleResend = () => {
    const fd = new FormData();
    fd.set("email", email);
    sendAction(fd);
    setCountdown(RESEND_SECONDS);
  };

  const handleVerify = () => {
    const fd = new FormData();
    fd.set("email", email);
    fd.set("code", code);
    verifyAction(fd);
  };

  return (
    <AuthShell
      badge={
        <>
          <Wrench className="h-3.5 w-3.5 text-zinc-950" />
          Pemulihan Akun
        </>
      }
      title={
        step === "email"
          ? "Lupa Kata Sandi"
          : step === "code"
          ? "Masukkan Kode"
          : step === "password"
          ? "Kata Sandi Baru"
          : "Berhasil"
      }
      subtitle={
        step === "email"
          ? "Masukkan email Anda dan kami akan mengirim kode verifikasi."
          : step === "code"
          ? `Kami telah mengirim kode 6 digit ke ${email || "email Anda"}. Masukkan kode untuk melanjutkan.`
          : step === "password"
          ? "Buat kata sandi baru untuk akun Anda."
          : "Kata sandi Anda berhasil diubah."
      }
    >
      {step === "email" && (
        <form
          action={sendAction}
          onSubmit={() => setCountdown(RESEND_SECONDS)}
          className="space-y-4"
        >
          {sendState?.error && <ErrorBox message={sendState.error} />}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Alamat Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="nama@email.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={sendPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-60"
          >
            {sendPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Kirim Kode
              </>
            )}
          </button>
        </form>
      )}

      {step === "code" && (
        <div className="space-y-4">
          {(verifyState?.error || sendState?.error) && (
            <ErrorBox message={verifyState?.error || sendState?.error || ""} />
          )}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
              Kode Verifikasi (6 digit)
            </label>
            <OtpInput value={code} onChange={setCode} disabled={verifyPending} />
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={sendPending || countdown > 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white py-3 text-xs font-semibold text-zinc-700 hover:border-zinc-950 transition disabled:opacity-50"
          >
            {sendPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : countdown > 0 ? (
              `Kirim ulang dalam ${fmt(countdown)}`
            ) : (
              <>
                <MailCheck className="h-4 w-4" /> Kirim Ulang Kode
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifyPending || code.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-60"
          >
            {verifyPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Lanjutkan
              </>
            )}
          </button>
          <p className="text-[11px] text-zinc-400 leading-relaxed text-center">
            Kode hanya dapat digunakan sekali. Tidak menerima email? Periksa folder spam atau kirim ulang.
          </p>
        </div>
      )}

      {step === "password" && (
        <form action={resetAction} className="space-y-4">
          {resetState?.error && <ErrorBox message={resetState.error} />}
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="token" value={token} />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Kata Sandi Baru</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              placeholder="Minimal 8 karakter, gabungan huruf & angka"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Konfirmasi Kata Sandi</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              placeholder="Ulangi kata sandi baru"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={resetPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-60"
          >
            {resetPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" /> Ubah Kata Sandi
              </>
            )}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 border border-emerald-200 bg-emerald-50 p-3.5 rounded-xl text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Kata sandi berhasil diatur ulang! Silakan masuk dengan kata sandi baru Anda.</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/auth/signin")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all"
          >
            <Lock className="h-4 w-4" /> Masuk Sekarang
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-1 font-semibold text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali masuk
        </Link>
        {step !== "email" && step !== "success" && (
          <span className="text-zinc-400">Kode berlaku 15 menit</span>
        )}
      </div>
    </AuthShell>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 border border-red-200 bg-red-50 p-3.5 rounded-xl text-xs text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
