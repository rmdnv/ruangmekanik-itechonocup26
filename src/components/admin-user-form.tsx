"use client";

import { useState } from "react";
import { adminUpdateUser, addNewTitle } from "@/app/users/[username]/actions";
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2, Plus, Save, X, Sparkles } from "lucide-react";

const MAX_TITLES = 5;
const MAX_TITLE_LENGTH = 40;

export function AdminUserForm({
  targetId,
  initialTitles,
  initialScore,
  availableTitles,
}: {
  targetId: string;
  initialTitles: string[];
  initialScore: number;
  availableTitles: string[];
}) {
  const [titles, setTitles] = useState<string[]>(initialTitles);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Suggestions = all titles in the master list that haven't been picked yet.
  const suggestions = availableTitles.filter((t) => !titles.includes(t));

  const addTitle = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    if (titles.length >= MAX_TITLES) {
      setError(`Maksimal ${MAX_TITLES} gelar per pengguna`);
      return;
    }
    if (clean.length > MAX_TITLE_LENGTH) {
      setError(`Gelar maksimal ${MAX_TITLE_LENGTH} karakter`);
      return;
    }
    if (titles.includes(clean)) return;
    setTitles((prev) => [...prev, clean]);
    setDraft("");
    setError(null);
  };

  const removeTitle = (title: string) => {
    setTitles((prev) => prev.filter((t) => t !== title));
  };

  const handleAddNewTitle = async () => {
    const clean = draft.trim();
    if (!clean) return;
    setAddLoading(true);
    setError(null);
    setSuccess(null);
    const res = await addNewTitle(clean);
    setAddLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal menambah gelar baru");
    } else {
      addTitle(clean);
      setDraft("");
      setSuccess(`Gelar "${clean}" berhasil ditambahkan ke daftar`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    form.set("titles", JSON.stringify(titles));
    const res = await adminUpdateUser(targetId, form);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Gagal menyimpan pengaturan");
    } else {
      setSuccess("Pengaturan admin tersimpan");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-zinc-300 bg-zinc-950 text-white rounded-2xl p-6 shadow-lg space-y-5"
    >
      <div className="flex items-center gap-2 text-sm font-bold">
        <ShieldCheck className="h-4 w-4" />
        Panel Admin Pengguna
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-400/30 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Gelar / Title <span className="normal-case font-normal text-zinc-500">(bisa lebih dari satu, maks. 5)</span>
        </label>

        {titles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {titles.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-white">
                {t}
                <button type="button" onClick={() => removeTitle(t)} className="text-zinc-400 hover:text-white transition-colors" aria-label={`Hapus gelar ${t}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Pick from existing master-list titles */}
        {suggestions.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
              <Sparkles className="h-3 w-3" /> Pilih gelar yang ada
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTitle(t)}
                  disabled={titles.length >= MAX_TITLES}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 hover:border-white hover:text-white transition disabled:opacity-40"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.ctrlKey || e.metaKey) {
                  handleAddNewTitle();
                } else {
                  addTitle(draft);
                }
              }
            }}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="Ketik gelar lalu Enter, atau Ctrl+Enter untuk gelar baru..."
            className="flex-1 min-w-0 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none transition"
          />
          <button
            type="button"
            onClick={() => addTitle(draft)}
            disabled={!draft.trim() || titles.length >= MAX_TITLES}
            title="Tambahkan gelar ke pengguna ini"
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-600 bg-zinc-900 hover:bg-zinc-800 px-3 py-2.5 text-xs font-semibold text-white transition-all disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </button>
          <button
            type="button"
            onClick={handleAddNewTitle}
            disabled={!draft.trim() || addLoading}
            title="Simpan sebagai gelar baru pada daftar gelar"
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-600 bg-emerald-900/40 hover:bg-emerald-900/70 px-3 py-2.5 text-xs font-semibold text-emerald-200 transition-all disabled:opacity-40"
          >
            {addLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Gelar Baru
          </button>
        </div>
        <p className="text-[10px] text-zinc-500">
          Enter = tambah ke pengguna · Ctrl+Enter = simpan sebagai gelar baru · {titles.length}/{MAX_TITLES} terpakai
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Skor Kontribusi</label>
        <input
          name="score"
          type="number"
          min={0}
          max={1000000}
          defaultValue={initialScore}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Simpan Pengaturan
      </button>
    </form>
  );
}