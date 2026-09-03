"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminDeleteGuide, adminDeleteDiagnostic } from "@/app/admin/actions";
import { Search, Trash2, Loader2, ExternalLink, FileText, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

export interface GuideItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  viewsCount: number;
  likesCount: number;
  createdAt: string;
  author: { name: string | null; username: string | null };
}

export interface DiagnosticItem {
  id: string;
  title: string;
  slug: string;
  commentsCount: number;
  likesCount: number;
  createdAt: string;
  author: { name: string | null; username: string | null };
}

export function ContentClient({
  guides,
  diagnostics,
}: {
  guides: GuideItem[];
  diagnostics: DiagnosticItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"guides" | "diagnostics">("guides");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredGuides = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      (g.author.name && g.author.name.toLowerCase().includes(search.toLowerCase())) ||
      (g.author.username && g.author.username.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredDiagnostics = diagnostics.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.author.name && d.author.name.toLowerCase().includes(search.toLowerCase())) ||
      (d.author.username && d.author.username.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDeleteGuide = async (id: string, title: string) => {
    if (!confirm(`Hapus panduan "${title}"?`)) return;
    setError(null);
    setSuccess(null);
    setDeletingId(id);
    const res = await adminDeleteGuide(id);
    setDeletingId(null);
    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setSuccess(`Panduan "${title}" telah dihapus.`);
      router.refresh();
    }
  };

  const handleDeleteDiagnostic = async (id: string, title: string) => {
    if (!confirm(`Hapus kasus diagnosa "${title}"?`)) return;
    setError(null);
    setSuccess(null);
    setDeletingId(id);
    const res = await adminDeleteDiagnostic(id);
    setDeletingId(null);
    if (!res.success && res.error) {
      setError(res.error);
    } else {
      setSuccess(`Kasus diagnosa "${title}" telah dihapus.`);
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

      {/* Header Toolbar & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("guides")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              tab === "guides"
                ? "bg-zinc-950 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Guides ({guides.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("diagnostics")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              tab === "diagnostics"
                ? "bg-zinc-950 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Diagnostics ({diagnostics.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-4 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
          />
        </div>
      </div>

      {/* Content Table */}
      {tab === "guides" ? (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-4">Guide</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Stats</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {filteredGuides.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      No guides found.
                    </td>
                  </tr>
                ) : (
                  filteredGuides.map((g) => (
                    <tr key={g.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-950 max-w-xs truncate">
                        <Link href={`/guides/${g.slug}`} className="hover:underline flex items-center gap-1.5">
                          {g.title}
                          <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                          {g.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-800">
                        {g.author.name || g.author.username || "Mekanik"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                        {g.viewsCount} views · {g.likesCount} likes
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        {new Date(g.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={deletingId === g.id}
                          onClick={() => handleDeleteGuide(g.id, g.title)}
                          className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Hapus Panduan"
                        >
                          {deletingId === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-4">Diagnostic</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Comments & Likes</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {filteredDiagnostics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      No diagnostics found.
                    </td>
                  </tr>
                ) : (
                  filteredDiagnostics.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-950 max-w-xs truncate">
                        <Link href={`/diagnostics/${d.slug}`} className="hover:underline flex items-center gap-1.5">
                          {d.title}
                          <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-800">
                        {d.author.name || d.author.username || "Mekanik"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                        {d.commentsCount} comments · {d.likesCount} likes
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        {new Date(d.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={deletingId === d.id}
                          onClick={() => handleDeleteDiagnostic(d.id, d.title)}
                          className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Hapus Diagnosa"
                        >
                          {deletingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
