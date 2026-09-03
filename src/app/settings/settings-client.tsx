"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/otp-input";
import {
  changePassword,
  requestEmailChange,
  confirmEmailChange,
  revokeDeviceSession,
  revokeAllOtherDevices,
} from "./actions";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  ShieldCheck,
  MonitorSmartphone,
  LogOut,
  Smartphone,
  Laptop,
  Monitor,
  ArrowRight,
  Globe2,
} from "lucide-react";

export interface SettingsSession {
  id: string;
  sessionId: string;
  device: string | null;
  os: string | null;
  browser: string | null;
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  lastSeenAt: string;
}

type SectionId = "password" | "email" | "devices";

export function SettingsClient({
  email,
  isOAuth,
  currentSessionId,
  sessions,
}: {
  email: string;
  isOAuth: boolean;
  currentSessionId: string | null;
  sessions: SettingsSession[];
}) {
  const [section, setSection] = useState<SectionId>("password");
  const [otpCode, setOtpCode] = useState("");
  const router = useRouter();

  const [pwState, pwAction, pwPending] = useActionState(changePassword, null);
  const [reqState, reqAction, reqPending] = useActionState(requestEmailChange, null);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmEmailChange, null);

  const targetEmail = confirmState?.email ?? reqState?.email ?? "";

  const emailStep: "sent" | "confirm" | "done" = confirmState?.success
    ? "done"
    : (reqState?.success && reqState.email) || confirmState?.email
    ? "confirm"
    : "sent";

  // If the email is mid-change (code sent), jump to the email section automatically.
  const activeSection: SectionId = section === "email" && emailStep === "done" ? "password" : section;

  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeAllState, setRevokeAllState] = useState<{ error?: string } | null>(null);

  const nav: { id: SectionId; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "password", label: "Kata Sandi", desc: "Ubah password akun", icon: <KeyRound className="h-4 w-4" /> },
    { id: "email", label: "Email", desc: "Alamat email & verifikasi", icon: <Mail className="h-4 w-4" /> },
    { id: "devices", label: "Perangkat", desc: "Sesi login aktif", icon: <MonitorSmartphone className="h-4 w-4" /> },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <header className="pb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">Pengaturan</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Kelola keamanan akun dan perangkat yang masuk.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar / nav */}
        <aside>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => {
              const active = activeSection === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSection(n.id)}
                  className={`flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    active ? "bg-zinc-100" : "hover:bg-zinc-50"
                  }`}
                >
                  <span className={`mt-0.5 ${active ? "text-zinc-950" : "text-zinc-400"}`}>{n.icon}</span>
                  <span>
                    <span className={`block text-sm font-semibold ${active ? "text-zinc-950" : "text-zinc-700"}`}>
                      {n.label}
                    </span>
                    <span className="block text-xs text-zinc-400 mt-0.5">{n.desc}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {activeSection === "password" && (
            <PasswordSection isOAuth={isOAuth} state={pwState} action={pwAction} pending={pwPending} />
          )}

          {activeSection === "email" && (
            <EmailSection
              email={email}
              step={emailStep}
              targetEmail={targetEmail}
              reqState={reqState}
              reqAction={reqAction}
              reqPending={reqPending}
              confirmState={confirmState}
              confirmAction={confirmAction}
              confirmPending={confirmPending}
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              router={router}
            />
          )}

          {activeSection === "devices" && (
            <DevicesSection
              sessions={sessions}
              currentSessionId={currentSessionId}
              revoking={revoking}
              setRevoking={setRevoking}
              revokeAllState={revokeAllState}
              setRevokeAllState={setRevokeAllState}
              router={router}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-2xs">
      <div className="border-b border-zinc-100 px-6 py-5">
        <h2 className="text-[15px] font-bold text-zinc-950">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-zinc-500">{subtitle}</p>}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function PasswordSection({
  isOAuth,
  state,
  action,
  pending,
}: {
  isOAuth: boolean;
  state: { success?: boolean; error?: string } | null;
  action: (payload: FormData) => void;
  pending: boolean;
}) {
  return (
    <SectionCard
      title="Kata Sandi"
      subtitle="Gunakan minimal 8 karakter, gabungan huruf dan angka."
    >
      {isOAuth ? (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Akun Google</p>
            <p className="mt-1 text-[13px] text-amber-700">
              Anda masuk melalui Google sehingga tidak memiliki kata sandi. Kelola password Anda lewat
              akun Google.
            </p>
          </div>
        </div>
      ) : (
        <form action={action} className="max-w-md space-y-5">
          {state?.success && <SuccessBox message="Kata sandi berhasil diubah." />}
          {state?.error && <ErrorBox message={state.error} />}
          <Field label="Kata sandi saat ini">
            <input type="password" name="current" required className={inputClass} />
          </Field>
          <Field label="Kata sandi baru">
            <input type="password" name="password" required minLength={8} className={inputClass} />
          </Field>
          <Field label="Konfirmasi kata sandi baru">
            <input type="password" name="confirm" required minLength={8} className={inputClass} />
          </Field>
          <div className="pt-1">
            <button type="submit" disabled={pending} className={primaryBtn}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" /> Simpan Kata Sandi
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}

function EmailSection({
  email,
  step,
  targetEmail,
  reqState,
  reqAction,
  reqPending,
  confirmState,
  confirmAction,
  confirmPending,
  otpCode,
  setOtpCode,
  router,
}: {
  email: string;
  step: "sent" | "confirm" | "done";
  targetEmail: string;
  reqState: { success?: boolean; email?: string; error?: string } | null;
  reqAction: (payload: FormData) => void;
  reqPending: boolean;
  confirmState: { success?: boolean; email?: string; error?: string } | null;
  confirmAction: (payload: FormData) => void;
  confirmPending: boolean;
  otpCode: string;
  setOtpCode: (v: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <SectionCard
      title="Alamat Email"
      subtitle={
        <>
          Email saat ini · <span className="font-mono font-semibold text-zinc-700">{email}</span>
        </>
      }
    >
      {step === "done" && (
        <div className="space-y-4">
          <SuccessBox message="Alamat email berhasil diubah. Anda telah keluar dari semua perangkat dan harus masuk kembali dengan email baru." />
          <button type="button" onClick={() => router.push("/auth/signin")} className={primaryBtn + " max-w-md"}>
            Masuk dengan Email Baru <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === "sent" && (
        <form action={reqAction} className="max-w-md space-y-5">
          {reqState?.error && <ErrorBox message={reqState.error} />}
          <Field label="Email baru">
            <input type="email" name="email" required placeholder="nama@email.com" className={inputClass} />
          </Field>
          <div className="pt-1">
            <button type="submit" disabled={reqPending} className={primaryBtn}>
              {reqPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mengirim kode...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Kirim Kode Verifikasi
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Kami kirim kode 6 digit ke email baru untuk konfirmasi kepemilikan.
          </p>
        </form>
      )}

      {step === "confirm" && (
        <form action={confirmAction} className="max-w-md space-y-5">
          {(confirmState?.error || reqState?.error) && (
            <ErrorBox message={confirmState?.error || reqState?.error || ""} />
          )}
          <input type="hidden" name="email" value={targetEmail} />
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Mail className="h-4 w-4 text-zinc-400" />
              <span className="font-mono font-semibold text-zinc-700">{targetEmail}</span>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Menunggu kode</span>
          </div>
          <div className="space-y-2.5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700">
              Kode Verifikasi
            </span>
            <OtpInput value={otpCode} onChange={setOtpCode} disabled={confirmPending} />
          </div>
          <div className="pt-1">
            <button type="submit" disabled={confirmPending || otpCode.length !== 6} className={primaryBtn}>
              {confirmPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan perubahan...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Konfirmasi & Ubah Email
                </>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setOtpCode("");
              const fd = new FormData();
              fd.set("email", targetEmail);
              reqAction(fd);
            }}
            disabled={reqPending}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-950 disabled:opacity-50"
          >
            Kirim ulang kode
          </button>
        </form>
      )}
    </SectionCard>
  );
}

function DevicesSection({
  sessions,
  currentSessionId,
  revoking,
  setRevoking,
  revokeAllState,
  setRevokeAllState,
  router,
}: {
  sessions: SettingsSession[];
  currentSessionId: string | null;
  revoking: string | null;
  setRevoking: (v: string | null) => void;
  revokeAllState: { error?: string } | null;
  setRevokeAllState: (v: { error?: string } | null) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const sessionsWithCurrentFirst = [...sessions].sort((a, b) =>
    a.sessionId === currentSessionId ? -1 : b.sessionId === currentSessionId ? 1 : 0
  );
  const others = sessions.filter((s) => s.sessionId !== currentSessionId);
  const current = sessions.find((s) => s.sessionId === currentSessionId);

  return (
    <SectionCard
      title="Perangkat yang masuk"
      subtitle={
        <>
          {sessions.length} perangkat · Anda dapat keluar dari perangkat lain secara individual.
        </>
      }
    >
      {revokeAllState?.error && <ErrorBox message={revokeAllState.error} />}

      {sessionsWithCurrentFirst.length === 0 ? (
        <p className="text-sm text-zinc-400">Belum ada sesi perangkat tercatat.</p>
      ) : (
        <div className="space-y-3">
          {sessionsWithCurrentFirst.map((s) => {
            const isCurrent = s.sessionId === currentSessionId;
            return (
              <DeviceRow
                key={s.id}
                device={s}
                isCurrent={isCurrent}
                revoking={revoking === s.id}
                onRevoke={() => {
                  setRevoking(s.id);
                  revokeDeviceSession(s.sessionId)
                    .then((res) => {
                      if (!res.success && res.error) setRevokeAllState({ error: res.error });
                      router.refresh();
                    })
                    .finally(() => setRevoking(null));
                }}
              />
            );
          })}
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-6 border-t border-zinc-100 pt-6">
          <button
            type="button"
            onClick={async () => {
              const res = await revokeAllOtherDevices();
              setRevokeAllState(res);
              router.refresh();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar dari {others.length} perangkat lain
          </button>
        </div>
      )}

      {current && (
        <p className="mt-6 text-xs text-zinc-400 leading-relaxed">
          Terakhir diperbarui · {timeAgo(new Date(current.lastSeenAt))}
        </p>
      )}
    </SectionCard>
  );
}

function DeviceRow({
  device,
  isCurrent,
  revoking,
  onRevoke,
}: {
  device: SettingsSession;
  isCurrent: boolean;
  revoking: boolean;
  onRevoke: () => void;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${isCurrent ? "border-zinc-200 bg-zinc-50" : "border-zinc-200"}`}>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
          isCurrent ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <DeviceIcon device={device.device} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-zinc-900">
            {device.device || deviceLabel(device.os, device.browser)}
          </p>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Perangkat ini
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {[device.browser, device.os].filter(Boolean).join(" · ") || "Perangkat"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Globe2 className="h-3 w-3" />
            {locationLabel(device)}
          </span>
          <span>Terakhir aktif {timeAgo(new Date(device.lastSeenAt))}</span>
        </div>
      </div>
      {!isCurrent && (
        <button
          type="button"
          disabled={revoking}
          onClick={onRevoke}
          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-[11px] font-semibold text-zinc-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          aria-label="Keluar dari perangkat ini"
        >
          {revoking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Keluar"}
        </button>
      )}
    </div>
  );
}

function isLocalIp(ip: string | null): boolean {
  if (!ip) return false;
  return ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.");
}

function locationLabel(device: SettingsSession): string {
  if (device.country && !isLocalIp(device.ip)) {
    return [device.city, device.region, device.country].filter(Boolean).join(", ");
  }
  return "Lokal / perangkat ini";
}

function DeviceIcon({ device }: { device: string | null }) {
  const d = (device || "").toLowerCase();
  if (d.includes("iphone") || d.includes("android") || d.includes("mobile") || d.includes("ponsel")) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (d.includes("mac") || d.includes("ipad") || d.includes("tablet") || d.includes("laptop")) {
    return <Laptop className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

function deviceLabel(os: string | null, browser: string | null): string {
  return [browser, os].filter(Boolean).join(" · ") || "Perangkat";
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d === 1) return "kemarin";
  if (d < 30) return `${d} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-950/5 transition";

const primaryBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:opacity-60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">{label}</label>
      {children}
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
