"use client";

import { useState } from "react";
import { StepBuilder } from "@/components/step-builder";
import { Save } from "lucide-react";

export function DiagnosticForm({
  action,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: { title: string; content: string };
}) {
  const [content, setContent] = useState(initial?.content ?? "");

  return (
    <form action={action} className="space-y-4 border border-zinc-200 rounded-2xl bg-white p-6 shadow-2xs">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Judul Kasus</label>
        <input
          name="title"
          required
          defaultValue={initial?.title}
          placeholder="Contoh: Mesin tidak mau starter di pagi hari"
          className="w-full border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Deskripsi Masalah</label>
        <input type="hidden" name="content" value={content} required />
        <StepBuilder content={content} onChange={setContent} lang="diagnostic" />
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {initial ? "Simpan Perubahan" : "Buka Kasus Diagnosa"}
      </button>
    </form>
  );
}