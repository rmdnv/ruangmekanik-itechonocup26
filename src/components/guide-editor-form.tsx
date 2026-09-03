"use client";

import { useState } from "react";
import { StepBuilder } from "@/components/step-builder";
import { Save } from "lucide-react";

export function GuideEditorForm({
  guide,
  action,
}: {
  guide: { title: string; category: string; content: string };
  action: (formData: FormData) => Promise<void>;
}) {
  const [content, setContent] = useState(guide.content);

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="space-y-3 pb-6 border-b border-zinc-200 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Edit Panduan</h1>
        <p className="text-sm text-zinc-500">Perbarui konten yang sudah terbit. Perubahan langsung tampil untuk pembaca.</p>
      </div>

      <form action={action} className="space-y-5 border border-zinc-200 rounded-2xl bg-white p-6 shadow-2xs">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Judul Panduan</label>
          <input
            name="title"
            defaultValue={guide.title}
            className="w-full border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Kategori</label>
          <input
            name="category"
            list="guide-categories"
            defaultValue={guide.category}
            className="w-full border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none transition"
          />
          <datalist id="guide-categories">
            {["Mesin", "Kelistrikan & Injeksi", "Suspensi & Kemudi", "AC & Kabin", "Body & Cat", "Ban & Roda", "Perawatan Umum"].map(
              (category) => (
                <option key={category} value={category} />
              )
            )}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Isi Panduan</label>
          <input type="hidden" name="content" value={content} required />
          <StepBuilder content={content} onChange={setContent} lang="guide" />
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all"
        >
          <Save className="h-4 w-4" />
          Simpan Perubahan
        </button>
      </form>
    </main>
  );
}