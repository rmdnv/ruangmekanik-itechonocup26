"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";
import { sanitizeHtml } from "@/lib/dompurify";
import { requireCurrentUser, requireOwnerOrAdmin } from "@/lib/session";

export async function createGuide(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "");
  const category = String(formData.get("category") ?? "general");
  const content = sanitizeHtml(String(formData.get("content") ?? ""));
  const slug = slugify(title);

  const user = await requireCurrentUser();

  await prisma.guide.create({ data: { title, category, content, slug, authorId: user.id } });

  await prisma.user.update({ where: { id: user.id }, data: { score: { increment: 10 } } });
}

export async function updateGuide(id: string, formData: FormData): Promise<void> {
  const guide = await prisma.guide.findUnique({ where: { id } });
  if (!guide) throw new Error("Not found");

  await requireOwnerOrAdmin(guide.authorId);

  const title = String(formData.get("title") ?? guide.title);
  const category = String(formData.get("category") ?? guide.category);
  const content = sanitizeHtml(String(formData.get("content") ?? guide.content));

  await prisma.guide.update({ where: { id }, data: { title, category, content, slug: slugify(title) } });
}

export async function deleteGuide(id: string): Promise<void> {
  const guide = await prisma.guide.findUnique({ where: { id } });
  if (!guide) throw new Error("Not found");

  await requireOwnerOrAdmin(guide.authorId);

  await prisma.guide.delete({ where: { id } });
}

export async function toggleGuideLike(id: string): Promise<{ liked: boolean; count: number }> {
  const user = await requireCurrentUser();
  const guide = await prisma.guide.findUnique({ where: { id } });
  if (!guide) throw new Error("Not found");

  const existing = await prisma.like.findUnique({
    where: { userId_guideId: { userId: user.id, guideId: id } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId: user.id, guideId: id } });
  }
  const count = await prisma.like.count({ where: { guideId: id } });
  return { liked: !existing, count };
}
