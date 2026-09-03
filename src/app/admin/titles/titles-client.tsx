"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addNewTitle } from "@/app/users/[username]/actions";
import { adminDeleteTitle } from "@/app/admin/actions";
import { Award, Plus, Trash2, Search, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export interface MasterTitleItem {
  id: string;
  name: string;
  createdAt: string;
  usageCount: number;
}

export function TitlesClient({ titles }: { titles: MasterTitleItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = titles.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await addNewTitle(newTitle);
    setLoading(false);

    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setSuccess(`Title "${newTitle.trim()}" added.`);
      setNewTitle("");
      router.refresh();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete title "${name}"?`)) return;
    setError(null);
    setSuccess(null);
    setDeletingId(id);

    const res = await adminDeleteTitle(id);
    setDeletingId(null);

    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setSuccess(`Title "${name}" deleted.`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form onSubmit={handleAdd} className="xl:col-span-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-950">Add Title</h2>
            <p className="mt-1 text-xs text-zinc-500">Add a new title to the shared catalog.</p>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Title name</label>
            <input
              type="text"
              required
              maxLength={40}
              placeholder="e.g. Master Engine Technician"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add title
          </button>
        </form>

        <div className="xl:col-span-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-950">Title catalog</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {filtered.length} of {titles.length} titles shown.
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search titles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-xs text-zinc-400">
                No titles found.
              </div>
            ) : (
              filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3 hover:border-zinc-300 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-950 truncate">{t.name}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">Used by {t.usageCount} users</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={deletingId === t.id}
                    onClick={() => handleDelete(t.id, t.name)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0 disabled:opacity-50"
                    title="Delete title"
                  >
                    {deletingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
