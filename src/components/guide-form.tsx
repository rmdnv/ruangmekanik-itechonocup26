"use client";

import { useState } from "react";
import { StepBuilder } from "@/components/step-builder";
import { Save } from "lucide-react";

const GUIDE_CATEGORIES = [
  "Mesin",
  "Kelistrikan & Injeksi",
  "Suspensi & Kemudi",
  "AC & Kabin",
  "Body & Cat",
  "Ban & Roda",
  "Perawatan Umum",
];

export function GuideForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [content, setContent] = useState("");

  return (
    <form action={action} className="space-y-4 border border-zinc-200 rounded-2xl bg-white p-6 shadow-2xs">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Judul Panduan</label>
        <input
          name="title"
          required
          placeholder="Contoh: Prosedur Ganti Oli Mesin Diesel"
          className="w-full border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Kategori</label>
        <input
          name="category"
          required
          list="guide-categories"
          placeholder="Pilih atau ketik kategori…"
          className="w-full border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
        />
        <datalist id="guide-categories">
          {GUIDE_CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Isi Panduan</label>
        <input type="hidden" name="content" value={content} required />
        <StepBuilder content={content} onChange={setContent} lang="guide" />
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        Terbitkan Panduan
      </button>
    </form>
  );
}