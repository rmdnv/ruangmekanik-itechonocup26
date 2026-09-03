"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteDiagnostic } from "@/app/diagnostics/actions";
import { PencilLine, Trash2, Share2 } from "lucide-react";

export function DiagnosticActions({
  id,
  slug,
  canManage,
}: {
  id: string;
  slug: string;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const handleShare = async () => {
    const url = `${window.location.origin}/diagnostics/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: document.title });
        window.alert("Link kasus dibagikan");
      } else {
        await navigator.clipboard.writeText(url);
        window.alert("Link kasus disalin");
      }
    } catch {
      try { await navigator.clipboard.writeText(url); } catch { /* noop */ }
      window.alert("Link kasus disalin");
    }
  };

  if (!canManage) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 border border-zinc-300 bg-white hover:bg-zinc-100 rounded-lg px-3.5 py-2 transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
      <Link
        href={`/diagnostics/${slug}/edit`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 border border-zinc-300 bg-white hover:bg-zinc-100 rounded-lg px-3.5 py-2 transition-colors"
      >
        <PencilLine className="h-3.5 w-3.5" />
        Edit Topik
      </Link>
      <button
        disabled={pending}
        onClick={() => startTransition(async () => deleteDiagnostic(id))}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3.5 py-2 transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Hapus
      </button>
    </div>
  );
}
