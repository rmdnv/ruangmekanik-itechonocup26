"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";
import { sanitizeHtml } from "@/lib/dompurify";
import { requireCurrentUser, requireOwnerOrAdmin } from "@/lib/session";

const SCORE_COMMENT = 2;
const SCORE_REPLY = 3;

export async function addComment(diagnosticId: string, content: string): Promise<void> {
  const user = await requireCurrentUser();

  await prisma.diagnosticComment.create({
    data: { diagnosticId, content: content.trim().slice(0, 2000), authorId: user.id },
  });

  await prisma.user.update({ where: { id: user.id }, data: { score: { increment: SCORE_COMMENT } } });
}

export async function addReply(diagnosticId: string, parentId: string, content: string): Promise<void> {
  const user = await requireCurrentUser();

  const parent = await prisma.diagnosticComment.findUnique({ where: { id: parentId } });
  if (!parent || parent.diagnosticId !== diagnosticId) throw new Error("Tanggapan tidak ditemukan");

  await prisma.diagnosticComment.create({
    data: {
      diagnosticId,
      parentId,
      content: content.trim().slice(0, 2000),
      authorId: user.id,
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { score: { increment: SCORE_REPLY } } });
}

export async function deleteComment(commentId: string): Promise<void> {
  const comment = await prisma.diagnosticComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Not found");

  await requireOwnerOrAdmin(comment.authorId);
  await prisma.diagnosticComment.delete({ where: { id: commentId } });
}

export async function updateComment(commentId: string, content: string): Promise<void> {
  const comment = await prisma.diagnosticComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Not found");

  await requireOwnerOrAdmin(comment.authorId);

  const clean = content.trim().slice(0, 2000);
  if (!clean) throw new Error("Tanggapan tidak boleh kosong");

  await prisma.diagnosticComment.update({
    where: { id: commentId },
    data: { content: clean, editedAt: new Date() },
  });
}

export async function createDiagnostic(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();

  const title = String(formData.get("title") ?? "");
  const content = sanitizeHtml(String(formData.get("content") ?? ""));
  await prisma.diagnostic.create({ data: { title, content, slug: slugify(title), authorId: user.id } });

  await prisma.user.update({ where: { id: user.id }, data: { score: { increment: 5 } } });
}

export async function updateDiagnostic(id: string, formData: FormData): Promise<void> {
  const diagnostic = await prisma.diagnostic.findUnique({ where: { id } });
  if (!diagnostic) throw new Error("Not found");

  await requireOwnerOrAdmin(diagnostic.authorId);

  const title = String(formData.get("title") ?? diagnostic.title);
  const content = sanitizeHtml(String(formData.get("content") ?? diagnostic.content));
  await prisma.diagnostic.update({ where: { id }, data: { title, content, slug: slugify(title) } });
}

export async function deleteDiagnostic(id: string): Promise<void> {
  const diagnostic = await prisma.diagnostic.findUnique({ where: { id } });
  if (!diagnostic) throw new Error("Not found");

  await requireOwnerOrAdmin(diagnostic.authorId);

  await prisma.diagnostic.delete({ where: { id } });
}

export async function toggleDiagnosticLike(id: string): Promise<{ liked: boolean; count: number }> {
  const user = await requireCurrentUser();
  const diagnostic = await prisma.diagnostic.findUnique({ where: { id } });
  if (!diagnostic) throw new Error("Not found");

  const existing = await prisma.like.findUnique({
    where: { userId_diagnosticId: { userId: user.id, diagnosticId: id } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId: user.id, diagnosticId: id } });
  }
  const count = await prisma.like.count({ where: { diagnosticId: id } });
  return { liked: !existing, count };
}

export async function toggleCommentLike(id: string): Promise<{ liked: boolean; count: number }> {
  const user = await requireCurrentUser();
  const comment = await prisma.diagnosticComment.findUnique({ where: { id } });
  if (!comment) throw new Error("Not found");

  const existing = await prisma.like.findUnique({
    where: { userId_commentId: { userId: user.id, commentId: id } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId: user.id, commentId: id } });
  }
  const count = await prisma.like.count({ where: { commentId: id } });
  return { liked: !existing, count };
}
