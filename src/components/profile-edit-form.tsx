"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/users/[username]/actions";
import { Loader2, Save, AlertCircle, CheckCircle2, UploadCloud, X } from "lucide-react";
import { AvatarCropModal } from "@/components/avatar-crop-modal";

export interface ProfileEditable {
  name: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export function ProfileEditForm({ profile }: { profile: ProfileEditable }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (avatarUrl) formData.set("avatarUrl", avatarUrl);

    const res = await updateProfile(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Gagal memperbarui profil");
      return;
    }

    setSuccess("Profil berhasil diperbarui");
    if (res.username) {
      router.push(`/users/${res.username}`);
      router.refresh();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropImageSrc(null);
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append("file", croppedBlob, "avatar.jpg");
    const res = await fetch("/api/upload", { method: "POST", body });
    setUploading(false);
    if (res.ok) {
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        setAvatarUrl(data.url);
      } else {
        setError("Gagal mengunggah foto profil.");
      }
    } else {
      setError("Gagal mengunggah foto profil. Gunakan JPG/PNG/WEBP maksimal 5MB.");
    }
  };

  return (
    <>
    {cropImageSrc && (
      <AvatarCropModal
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        onClose={() => setCropImageSrc(null)}
      />
    )}
    <form onSubmit={handleSubmit} className="border border-zinc-200 rounded-2xl bg-white p-6 shadow-2xs space-y-5">
      <h3 className="text-sm font-bold text-zinc-950">Edit Profil</h3>

      {error && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 rounded-xl text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-3 rounded-xl text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- avatar preview */}
            <img
              src={avatarUrl}
              alt="Foto profil"
              className="h-16 w-16 rounded-full object-cover bg-zinc-100 ring-1 ring-zinc-200"
            />
            <button
              type="button"
              onClick={() => setAvatarUrl(null)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
              title="Hapus foto"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 rounded-full bg-zinc-900 text-white flex items-center justify-center text-lg font-bold uppercase shrink-0">
            {(profile.name || "U")[0]}
          </div>
        )}

        <label
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {uploading ? "Mengunggah..." : "Unggah Foto"}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Nama Lengkap</label>
        <input
          name="name"
          required
          defaultValue={profile.name ?? ""}
          className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-950 focus:outline-none transition"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Username</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-mono">@</span>
          <input
            name="username"
            required
            defaultValue={profile.username ?? ""}
            className="w-full border border-zinc-300 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono focus:border-zinc-950 focus:outline-none transition"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">Bio</label>
        <textarea
          name="bio"
          rows={3}
          maxLength={160}
          defaultValue={profile.bio ?? ""}
          placeholder="Sebutkan spesialisasi atau bidang kerja Anda..."
          className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm resize-none placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Simpan Perubahan
      </button>
    </form>
    </>
  );
}