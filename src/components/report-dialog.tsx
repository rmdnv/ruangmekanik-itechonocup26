"use client";

import { useEffect, useState } from "react";
import { createReport } from "@/app/report/actions";
import { AlertCircle, CheckCircle2, Flag, Loader2, ShieldAlert, X } from "lucide-react";

const REASONS = [
  "Konten tidak pantas / mengandung spam",
  "Informasi teknis menyesatkan yang berbahaya",
  "Perilaku tidak sopan / pelecehan",
  "Impersonasi / identitas palsu",
  "Alasan lainnya",
];

export function ReportDialog({
  reportedId,
  reportedName,
  commentId,
  triggerLabel = "Laporkan",
  triggerClassName = "",
}: {
  reportedId: string;
  reportedName: string;
  commentId?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setReason("");
      setDetail("");
      setError(null);
      setSuccess(null);
    }, 150);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setSending(true);
    const res = await createReport(reportedId, reason, detail, commentId || undefined);
    setSending(false);
    if (!res.success) {
      setError(res.error || "Gagal mengirim laporan");
    } else {
      setSuccess("Laporan terkirim dan masuk antrean peninjauan admin.");
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        <Flag className="h-3 w-3" />
        <span>{triggerLabel}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl p-6 space-y-4">
            {success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-bold">Laporan terkirim</p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {success} Admin akan meninjau laporan terhadap pengguna{" "}
                  <span className="font-semibold text-zinc-900">@{reportedName}</span>.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="w-full rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-9 w-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                      <ShieldAlert className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-950">Laporkan Pengguna</h3>
                      <p className="text-[11px] text-zinc-500">@ {reportedName}</p>
                    </div>
                  </div>
                  <button type="button" onClick={close} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700">Alasan Laporan</label>
                  <div className="space-y-1.5">
                    {REASONS.map((r) => (
                      <label
                        key={r}
                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs cursor-pointer transition-all ${
                          reason === r
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="sr-only"
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                    Keterangan Tambahan{" "}
                    <span className="font-normal normal-case text-zinc-400">(opsional)</span>
                  </label>
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Jelaskan secara singkat apa yang terjadi, sertakan konteks jika perlu."
                    className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 resize-none focus:border-zinc-950 focus:outline-none transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={sending || !reason}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                  Kirim Laporan
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}