"use client";

import { useRef, useState } from "react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { MediaSlot } from "@/components/media-upload";
import { ChevronDown, ChevronUp, ListPlus, Pencil, Trash2 } from "lucide-react";

type Block = {
  id: string;
  heading: string;
  text: string;
  image: string | null;
  video: string | null;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((block) => {
      const parts: string[] = [];
      if (block.heading.trim()) parts.push(`<h3>${esc(block.heading.trim())}</h3>`);
      if (block.text.trim()) {
        parts.push(`<p>${esc(block.text.trim()).replace(/\n/g, "<br>")}</p>`);
      }
      if (block.video) {
        parts.push(`<video controls preload="metadata" class="rm-media rm-media-video" src="${esc(block.video)}"></video>`);
      }
      if (block.image) {
        parts.push(`<img class="rm-media rm-media-image" src="${esc(block.image)}" alt="" />`);
      }
      return parts.join("\n");
    })
    .join("\n");
}

function htmlToBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: Block[] = [];
  let current: Block | null = null;

  const ensure = (): Block => {
    if (!current) {
      current = { id: crypto.randomUUID(), heading: "", text: "", image: null, video: null };
      blocks.push(current);
    }
    return current;
  };

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      const text = (node.textContent ?? "").trim();
      if (!text) return;
      const block = ensure();
      block.text = block.text ? `${block.text.trimEnd()}\n${text}` : text;
      return;
    }
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (["h1", "h2", "h3", "h4"].includes(tag)) {
      const heading = el.textContent?.trim() ?? "";
      if (current && (current.heading || current.text || current.image || current.video)) {
        current = null;
      }
      ensure().heading = heading;
    } else if (tag === "img") {
      ensure().image = el.getAttribute("src") || "";
    } else if (tag === "video" || tag === "source") {
      const src = el.getAttribute("src") || "";
      if (src) ensure().video = src;
    } else {
      const holder = doc.createElement("div");
      holder.innerHTML = (el.innerHTML ?? "").replace(/<br\s*\/?>/gi, "\n");
      const text = (holder.textContent ?? "").trim();
      if (!text) return;
      const block = ensure();
      block.text = block.text ? `${block.text.trimEnd()}\n${text}` : text;
    }
  });

  return blocks;
}

const RICH_PATTERN = /<(strong|b|em|i|ul|ol|blockquote|pre|code|h1|h2|table|figure|a)(\s|\/|>)/i;

export function StepBuilder({
  content,
  onChange,
  lang = "guide",
}: {
  content: string;
  onChange: (value: string) => void;
  lang?: "guide" | "diagnostic";
}) {
  const isRich = RICH_PATTERN.test(content) && content.includes(">");
  const [mode, setMode] = useState<"steps" | "advanced">(isRich ? "advanced" : "steps");
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (content) return htmlToBlocks(content);
    return [{ id: crypto.randomUUID(), heading: "", text: "", image: null, video: null }];
  });
  const [activeEditor, setActiveEditor] = useState(blocksToHtml(blocks));
  const latestAdvanced = useRef(activeEditor);

  const handleAdvancedChange = (html: string) => {
    latestAdvanced.current = html;
    onChange(html);
  };

  const update = (next: Block[]) => {
    setBlocks(next);
    onChange(blocksToHtml(next));
  };

  const patchBlock = (id: string, patch: Partial<Block>) => {
    update(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const addBlock = () => {
    update([...blocks, { id: crypto.randomUUID(), heading: "", text: "", image: null, video: null }]);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) {
      update([{ id: crypto.randomUUID(), heading: "", text: "", image: null, video: null }]);
      return;
    }
    update(blocks.filter((block) => block.id !== id));
  };

  const toggleMode = (next: "steps" | "advanced") => {
    if (next === mode) return;
    if (next === "advanced") {
      setActiveEditor(blocksToHtml(blocks));
      latestAdvanced.current = blocksToHtml(blocks);
      setMode(next);
      return;
    }
    const parsed = htmlToBlocks(latestAdvanced.current);
    const html = blocksToHtml(parsed);
    setBlocks(parsed);
    setActiveEditor(html);
    latestAdvanced.current = html;
    onChange(html);
    setMode(next);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-zinc-300 bg-zinc-50 p-0.5">
          <button
            type="button"
            onClick={() => toggleMode("steps")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              mode === "steps" ? "bg-zinc-950 text-white shadow" : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <ListPlus className="h-3.5 w-3.5" />
            Langkah demi Langkah
          </button>
          <button
            type="button"
            onClick={() => toggleMode("advanced")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              mode === "advanced" ? "bg-zinc-950 text-white shadow" : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editor Bebas
          </button>
        </div>
        {mode === "steps" && (
          <button
            type="button"
            onClick={addBlock}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2 transition"
          >
            <ListPlus className="h-3.5 w-3.5" />
            Tambah {lang === "guide" ? "Langkah" : "Bagian"}
          </button>
        )}
      </div>

      <p className="text-[11px] text-zinc-400">
        {mode === "steps"
          ? "Susun konten per langkah, setiap langkah boleh diberi foto dan/atau video. Foto & video terunggah otomatis ke server."
          : "Mode bebas untuk format lanjutan (tebal, daftar, kutipan, dan penyisipan media)."}
      </p>

      {mode === "advanced" ? (
        <TiptapEditor content={activeEditor} onChange={handleAdvancedChange} />
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[11px] font-mono font-bold text-zinc-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 text-[9px] text-white">
                    {index + 1}
                  </span>
                  {lang === "guide" ? "Langkah" : "Bagian"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30"
                    aria-label="Naik"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === blocks.length - 1}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30"
                    aria-label="Turun"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    aria-label="Hapus langkah"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Judul {lang === "guide" ? "langkah" : "bagian"} (opsional)
                </label>
                <input
                  value={block.heading}
                  onChange={(e) => patchBlock(block.id, { heading: e.target.value })}
                  placeholder={lang === "guide" ? "mis. Lepas baut roda pengaman" : "mis. Hasil pengukuran awal"}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">Uraian</label>
                <textarea
                  value={block.text}
                  onChange={(e) => patchBlock(block.id, { text: e.target.value })}
                  rows={3}
                  placeholder={
                    lang === "guide"
                      ? "Jelaskan prosedur teknis di langkah ini, termasuk spesifikasi/momen pengencangan bila ada…"
                      : "Jelaskan kondisi, gejala, atau hasil pengujian…"
                  }
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none resize-none transition"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <MediaSlot
                  kind="image"
                  url={block.image}
                  onSelect={(url) => patchBlock(block.id, { image: url })}
                />
                <MediaSlot
                  kind="video"
                  url={block.video}
                  onSelect={(url) => patchBlock(block.id, { video: url })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}