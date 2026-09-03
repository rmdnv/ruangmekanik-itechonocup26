"use client";

import { useRef, useState } from "react";
import { FileVideo2, ImagePlus, Loader2, RefreshCcw, Trash2, UploadCloud } from "lucide-react";

export async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Gagal mengunggah file.");
  }
  return data.url;
}

export function MediaSlot({
  kind,
  url,
  onSelect,
  label,
}: {
  kind: "image" | "video";
  url: string | null;
  onSelect: (url: string | null) => void;
  label?: { empty?: string; change?: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    if (kind === "image" && isVideo) {
      setError("Slot ini untuk foto. Gunakan slot video.");
      return;
    }
    if (kind === "video" && !isVideo) {
      setError("Slot ini untuk video. Gunakan slot foto.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      onSelect(uploaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah file.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (url) {
    return (
      <div className="space-y-1.5">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic upload preview
            <img src={url} alt="Pratinjau media" className="w-full max-h-64 object-contain bg-zinc-100" />
          ) : (
            <video src={url} controls preload="metadata" className="w-full max-h-64 object-contain bg-black" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            {label?.change ?? "Ganti"}
          </button>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        </div>
        <input hidden ref={inputRef} type="file" accept={kind === "image" ? "image/*" : "video/*"} onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0] ?? null;
          if (file) void handleFile(file);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragging ? "border-zinc-950 bg-zinc-100" : "border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
            <p className="text-xs text-zinc-500 font-medium">Mengunggah…</p>
          </>
        ) : kind === "image" ? (
          <>
            <ImagePlus className="h-6 w-6 text-zinc-400 group-hover:text-zinc-700 transition" />
            <p className="text-xs text-zinc-600 font-medium">{label?.empty ?? "Tambah Foto"}</p>
            <p className="text-[10px] text-zinc-400">klik atau seret foto ke sini · JPG/PNG/WEBP, maks 5MB</p>
          </>
        ) : (
          <>
            <FileVideo2 className="h-6 w-6 text-zinc-400 group-hover:text-zinc-700 transition" />
            <p className="text-xs text-zinc-600 font-medium">{label?.empty ?? "Tambah Video"}</p>
            <p className="text-[10px] text-zinc-400">klik atau seret video ke sini · MP4/WEBM, maks 100MB</p>
          </>
        )}
      </div>
      <input
        hidden
        ref={inputRef}
        type="file"
        accept={kind === "image" ? "image/*" : "video/*"}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
      <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-zinc-400">
        <UploadCloud className="h-3 w-3" />
        unggahan tersimpan otomatis di server
      </p>
    </div>
  );
}