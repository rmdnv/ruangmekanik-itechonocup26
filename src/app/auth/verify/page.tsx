"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { requestSignupVerification, verifySignup } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { OtpInput } from "@/components/otp-input";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Wrench, MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialEmail = params.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);

  const [sendState, sendAction, sendPending] = useActionState(requestSignupVerification, null);
  const [state, formAction, pending] = useActionState(verifySignup, null);

  // On success, go to sign-in.
  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => router.push("/auth/signin"), 1500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  return (
    <AuthShell
      badge={
        <>
          <Wrench className="h-3.5 w-3.5 text-zinc-950" />
          Verifikasi Email
        </>
      }
      title="Verifikasi Akun Anda"
      subtitle="Kami telah mengirim kode 6 digit ke email Anda. Masukkan kode untuk mengaktifkan akun."
    >
      {state?.success ? (
        <div className="flex items-start gap-2.5 border border-emerald-200 bg-emerald-50 p-3.5 rounded-xl text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Email berhasil diverifikasi! Mengarahkan ke halaman masuk...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2.5 border border-red-200 bg-red-50 p-3.5 rounded-xl text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          {sendState?.success && sendState.email && sendState.email !== email && (
            <div className="flex items-center gap-2.5 border border-emerald-200 bg-emerald-50 p-3.5 rounded-xl text-xs text-emerald-800">
              <MailCheck className="h-4 w-4 shrink-0" />
              <span>Kode baru telah dikirim ke {sendState.email}.</span>
            </div>
          )}

          <form action={sendAction} className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Alamat Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="flex-1 border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={sendPending}
                title="Kirim ulang kode"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 hover:border-zinc-950 transition disabled:opacity-50"
              >
                {sendPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim Ulang"}
              </button>
            </div>
          </form>

          <form action={formAction} className="space-y-3">
            <input type="hidden" name="email" value={email} />
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Kode Verifikasi</label>
              <OtpValueField />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Verifikasi Email
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-zinc-400 leading-relaxed text-center">
            Tidak menerima email? Periksa folder spam, atau klik “Kirim Ulang”. Kode berlaku 15 menit.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs">
        <Link href="/auth/signin" className="inline-flex items-center gap-1 font-semibold text-zinc-500 hover:text-zinc-950">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali masuk
        </Link>
        <span className="text-zinc-400">Sudah verifikasi? <Link href="/auth/signin" className="font-semibold text-zinc-700 hover:underline">Masuk</Link></span>
      </div>
    </AuthShell>
  );
}

function OtpValueField() {
  const [code, setCode] = useState("");
  return (
    <>
      <input type="hidden" name="code" value={code} />
      <OtpInput value={code} onChange={setCode} />
    </>
  );
}
