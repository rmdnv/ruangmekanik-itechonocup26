"use client";

import { useState, useTransition } from "react";
import { banUser, unbanUser } from "@/app/users/[username]/actions";
import { AlertTriangle, Ban, CheckCircle2, ShieldAlert, Loader2, Unlock } from "lucide-react";

export function BanControl({
  targetId,
  targetUsername,
  isBanned,
  bannedReason,
}: {
  targetId: string;
  targetUsername: string;
  isBanned: boolean;
  bannedReason: string | null;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleBan = () => {
    setError(null);
    startTransition(async () => {
      const res = await banUser(targetId, reason);
      if (!res.success) setError(res.error || "Gagal memblokir pengguna");
      else setReason("");
    });
  };

  const handleUnban = () => {
    setError(null);
    startTransition(async () => {
      const res = await unbanUser(targetId);
      if (!res.success) setError(res.error || "Gagal mencabut pemblokiran");
    });
  };

  if (isBanned) {
    return (
      <div className="border border-red-400/40 bg-red-50/70 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <Ban className="h-4 w-4 shrink-0" />
          <p className="text-sm font-bold">Akun Dibekukan</p>
        </div>
        {bannedReason && (
          <p className="text-xs text-zinc-700 leading-relaxed">
            <span className="font-semibold text-red-700">Alasan: </span>
            {bannedReason}
          </p>
        )}
        <p className="text-[11px] text-zinc-500">
          Pengguna ini tidak dapat masuk atau terlibat aktivitas di platform. Untuk mencabut, gunakan tombol di bawah.
        </p>
        {error && <p className="text-xs text-red-700">{error}</p>}
        <button
          type="button"
          onClick={handleUnban}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 transition-all disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
          Cabut Blokir
        </button>
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 rounded-2xl bg-white p-5 space-y-3 shadow-2xs">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-zinc-500 shrink-0" />
        <p className="text-sm font-bold text-zinc-950">Status Akun</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        Akun aktif — blokir jika pengguna melanggar aturan.
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={200}
        placeholder="Alasan pemblokiran (opsional, contoh: mengirim spam berulang kali)..."
        className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 resize-none focus:border-zinc-950 focus:outline-none transition"
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <button
        type="button"
        onClick={handleBan}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 transition-all disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
        Blokir Pengguna {targetUsername ? `@${targetUsername}` : ""}
      </button>
      <p className="text-[10px] text-zinc-400 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Pengguna yang diblokir tidak bisa login kembali.
      </p>
    </div>
  );
}