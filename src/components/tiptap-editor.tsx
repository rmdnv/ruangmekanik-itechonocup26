"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useRef, useState } from "react";
import { uploadMedia } from "@/components/media-upload";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  ImagePlus,
  Clapperboard,
  Loader2,
} from "lucide-react";

export function TiptapEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (value: string) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState<"image" | "video" | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "rm-media rm-media-image" } }),
      Placeholder.configure({
        placeholder: "Tuliskan rincian langkah teknis, spesifikasi, atau pengujian...",
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] bg-white p-4 text-sm text-zinc-900 focus:outline-none leading-relaxed font-sans border-t border-zinc-200",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const handleMedia = async (file: File | null, kind: "image" | "video") => {
    if (!file || !editor) return;
    setUploadingMedia(kind);
    try {
      const url = await uploadMedia(file);
      if (kind === "image") {
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent(`<video controls class="rm-media rm-media-video" src="${url}"></video>`)
          .run();
      }
    } catch (e) {
      // surface via editor focus loss? keep silent + console
      console.error("Insert media failed", e);
    } finally {
      setUploadingMedia(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  if (!editor) return null;

  return (
    <div className="border border-zinc-300 rounded-lg overflow-hidden bg-white shadow-sm focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-zinc-50 px-3 py-2 border-b border-zinc-200 text-zinc-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-zinc-200 transition ${
            editor.isActive("bold") ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
          }`}
          title="Tebal"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-zinc-200 transition ${
            editor.isActive("italic") ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
          }`}
          title="Miring"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-zinc-200 transition ${
            editor.isActive("heading", { level: 2 }) ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
          }`}
          title="Judul 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded hover:bg-zinc-200 transition ${
            editor.isActive("heading", { level: 3 }) ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
          }`}
          title="Judul 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-zinc-200 transition ${
            editor.isActive("bulletList") ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
          }`}
          title="Daftar Poin"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-zinc-200 transition ${
            editor.isActive("orderedList") ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
          }`}
          title="Daftar Angka"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-zinc-200 transition ${
            editor.isActive("blockquote") ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
          }`}
          title="Kutipan"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded hover:bg-zinc-200 transition ${
            editor.isActive("codeBlock") ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""
          }`}
          title="Blok Kode"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 mx-1" />

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingMedia !== null}
          className="p-1.5 rounded hover:bg-zinc-200 transition disabled:opacity-40 inline-flex items-center gap-1.5"
          title="Sisipkan Foto"
        >
          {uploadingMedia === "image" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Foto
        </button>
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          disabled={uploadingMedia !== null}
          className="p-1.5 rounded hover:bg-zinc-200 transition disabled:opacity-40 inline-flex items-center gap-1.5"
          title="Sisipkan Video"
        >
          {uploadingMedia === "video" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Clapperboard className="h-4 w-4" />
          )}
          Video
        </button>
        <input
          hidden
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => void handleMedia(e.target.files?.[0] ?? null, "image")}
        />
        <input
          hidden
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => void handleMedia(e.target.files?.[0] ?? null, "video")}
        />

        <div className="h-4 w-[1px] bg-zinc-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-zinc-200 transition disabled:opacity-30"
          title="Urungkan"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-zinc-200 transition disabled:opacity-30"
          title="Ulangi"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
