import { prisma } from "@/lib/prisma";

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export async function findAvailableUsername(
  base: string,
  excludeId?: string,
  maxAttempts = 8
): Promise<string | null> {
  let root = slugifyUsername(base) || "user";
  if (root.length > 18) root = root.slice(0, 18);
  for (let i = 0; i < maxAttempts; i++) {
    let candidate = i === 0 ? root : `${root}${i + 1}`;
    if (candidate.length > 20) candidate = candidate.slice(0, 20);
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    if (existing.id === excludeId) return candidate;
    if (i === maxAttempts - 1) return `${candidate}${Date.now().toString(36).slice(-4)}`;
  }
  return `${root}-${Date.now().toString(36).slice(-4)}`;
}

/** Ensure a username exists for a user (auto-generates from name/email if missing). */
export async function ensureUsername(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
}): Promise<string | null> {
  if (user.username) return user.username;
  const base = user.name || (user.email || "").split("@")[0] || "user";
  const username = await findAvailableUsername(base);
  if (!username) return null;
  await prisma.user.update({ where: { id: user.id }, data: { username } });
  return username;
}