import { GuideForm } from "@/components/guide-form";
import { createGuide } from "../actions";
import { PenLine } from "lucide-react";

export default function NewGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="space-y-3 pb-6 border-b border-zinc-200 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-[11px] font-mono text-zinc-700">
          <PenLine className="h-3.5 w-3.5 text-zinc-950" />
          <span>Penulis Panduan</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Tulis Panduan Baru</h1>
        <p className="text-sm text-zinc-500 max-w-2xl">
          Susun prosedur selangkah demi selangkah. Setiap langkah bisa disertai foto dan video hasil kerja langsung di bengkel.
        </p>
      </div>

      <GuideForm action={createGuide} />
    </main>
  );
}