"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

const USERNAME_RE = /^[a-z0-9_-]{3,20}$/;
const MAX_BIO = 160;
const MAX_TITLE = 40;
const MAX_TITLES = 5;
const MAX_BAN_REASON = 200;
const MAX_SCORE = 1_000_000;

export interface ActionResult {
  success: boolean;
  error?: string;
  username?: string;
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireCurrentUser();

  const name = String(formData.get("name") ?? "").trim();
  const usernameRaw = String(formData.get("username") ?? "").trim().toLowerCase();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  if (name.length < 2) return { success: false, error: "Nama minimal 2 karakter" };
  if (!USERNAME_RE.test(usernameRaw)) {
    return { success: false, error: "Username harus 3-20 karakter, hanya huruf kecil, angka, strip (_ -)" };
  }

  const conflict = await prisma.user.findUnique({ where: { username: usernameRaw } });
  if (conflict && conflict.id !== user.id) {
    return { success: false, error: "Username sudah dipakai pengguna lain" };
  }

  if (bio.length > MAX_BIO) return { success: false, error: `Bio maksimal ${MAX_BIO} karakter` };

  const nextAvatarUrl =
    avatarUrl && (avatarUrl.startsWith("/api/uploads/") || avatarUrl.startsWith("/uploads/")) && avatarUrl.length < 300
      ? avatarUrl
      : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      username: usernameRaw,
      bio: bio || null,
      avatarUrl: nextAvatarUrl ?? undefined,
    },
  });

  return { success: true, username: usernameRaw };
}

export async function adminUpdateUser(targetId: string, formData: FormData): Promise<ActionResult> {
  const admin = await requireCurrentUser();
  if (admin.role !== "admin") return { success: false, error: "Hanya admin yang dapat melakukan ini" };

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { success: false, error: "Pengguna tidak ditemukan" };

  const titlesRaw = String(formData.get("titles") ?? "[]");
  const scoreRaw = String(formData.get("score") ?? "").trim();

  let titles: string[] = [];
  try {
    const parsed = JSON.parse(titlesRaw);
    if (Array.isArray(parsed)) {
      titles = parsed
        .map((t: unknown) => String(t).trim())
        .filter(Boolean)
        .slice(0, MAX_TITLES);
    }
  } catch {
    return { success: false, error: "Format gelar tidak valid" };
  }

  if (titles.length > MAX_TITLES) return { success: false, error: `Maksimal ${MAX_TITLES} gelar per pengguna` };
  if (titles.some((t) => t.length > MAX_TITLE)) {
    return { success: false, error: `Gelar maksimal ${MAX_TITLE} karakter` };
  }

  // Enrich the master list with any titles assigned that are not yet registered.
  if (titles.length > 0) {
    const existing = await prisma.title.findMany({ where: { name: { in: titles } } });
    const existingNames = new Set(existing.map((t) => t.name));
    const toCreate = titles.filter((t) => !existingNames.has(t)).map((name) => ({ name }));
    if (toCreate.length > 0) {
      await prisma.title.createMany({ data: toCreate, skipDuplicates: true });
    }
  }

  const score = Number.parseInt(scoreRaw, 10);
  if (Number.isNaN(score) || score < 0 || score > MAX_SCORE) {
    return { success: false, error: "Skor harus berupa angka 0 sampai 1.000.000" };
  }

  await prisma.user.update({
    where: { id: targetId },
    data: {
      titles,
      score,
    },
  });

  return { success: true };
}

export async function banUser(targetId: string, reason: string): Promise<ActionResult> {
  const admin = await requireCurrentUser();
  if (admin.role !== "admin") return { success: false, error: "Hanya admin yang dapat melakukan ini" };

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { success: false, error: "Pengguna tidak ditemukan" };
  if (target.id === admin.id) return { success: false, error: "Tidak dapat memblokir akun sendiri" };
  if (target.role === "admin") return { success: false, error: "Tidak dapat memblokir admin lain" };

  const cleanReason = reason.trim().slice(0, MAX_BAN_REASON) || "Melanggar aturan komunitas";

  await prisma.user.update({
    where: { id: targetId },
    data: { banned: true, bannedReason: cleanReason, bannedAt: new Date() },
  });

  if (target.username) revalidatePath(`/users/${target.username}`);
  revalidatePath("/admin/laporan");
  return { success: true };
}

/** Fetch all titles in the master list, sorted by name. Read-only (usable in RSC). */
export async function getAllTitles(): Promise<{ id: string; name: string }[]> {
  return prisma.title.findMany({ orderBy: { name: "asc" } });
}

export async function addNewTitle(name: string): Promise<ActionResult> {
  const admin = await requireCurrentUser();
  if (admin.role !== "admin") return { success: false, error: "Hanya admin yang dapat melakukan ini" };

  const clean = String(name ?? "").trim().slice(0, MAX_TITLE);
  if (!clean) return { success: false, error: "Nama gelar tidak boleh kosong" };

  const existing = await prisma.title.findUnique({ where: { name: clean } });
  if (existing) return { success: false, error: "Gelar tersebut sudah ada" };

  await prisma.title.create({ data: { name: clean } });
  return { success: true };
}

export async function unbanUser(targetId: string): Promise<ActionResult> {
  const admin = await requireCurrentUser();
  if (admin.role !== "admin") return { success: false, error: "Hanya admin yang dapat melakukan ini" };

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { success: false, error: "Pengguna tidak ditemukan" };

  await prisma.user.update({
    where: { id: targetId },
    data: { banned: false, bannedReason: null, bannedAt: null },
  });

  if (target.username) revalidatePath(`/users/${target.username}`);
  revalidatePath("/admin/laporan");
  return { success: true };
}