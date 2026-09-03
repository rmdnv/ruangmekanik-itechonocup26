"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";
import { serializeMessageFor, MAX_MESSAGE, EDIT_DELETE_WINDOW_MS, type ActionResult, type SendMessageResult } from "@/lib/messaging";

async function findConversationForUserOrThrow(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new Error("NotFound");
  if (conversation.user1Id !== userId && conversation.user2Id !== userId) throw new Error("Forbidden");
  return conversation;
}

export async function sendMessage(conversationId: string, content: string): Promise<SendMessageResult> {
  const user = await requireCurrentUser();
  const conversation = await findConversationForUserOrThrow(conversationId, user.id);

  const otherId = conversation.user1Id === user.id ? conversation.user2Id : conversation.user1Id;
  const blocked = await checkBlocked(user.id, otherId);
  if (blocked) return { ok: false, error: "" };

  const clean = content.trim().slice(0, MAX_MESSAGE);
  if (!clean) return { ok: false, error: "Pesan kosong." };

  const message = await prisma.message.create({
    data: { conversationId, senderId: user.id, content: clean },
  });

  revalidatePath("/messages");
  revalidatePath("/messages/[username]", "layout");

  const serialized = serializeMessageFor(message, user.id);
  if (!serialized) return { ok: false, error: "Gagal mengirim pesan." };
  return { ok: true, message: serialized };
}

export async function editMessage(messageId: string, content: string): Promise<ActionResult> {
  const user = await requireCurrentUser();

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return { ok: false, error: "Pesan tidak ditemukan." };
  if (message.senderId !== user.id) return { ok: false, error: "Kamu tidak berhak mengedit pesan ini." };
  if (message.deletedAt) return { ok: false, error: "Pesan sudah dihapus untuk semua." };

  const age = Date.now() - message.createdAt.getTime();
  if (age > EDIT_DELETE_WINDOW_MS) {
    return { ok: false, error: "Waktu edit habis — hanya bisa dalam 10 menit setelah pesan dikirim." };
  }

  const clean = content.trim().slice(0, MAX_MESSAGE);
  if (!clean) return { ok: false, error: "Pesan kosong." };

  await prisma.message.update({
    where: { id: messageId },
    data: { content: clean, editedAt: new Date() },
  });

  revalidatePath("/messages/[username]", "layout");
  return { ok: true };
}

export async function deleteMessageForMe(messageId: string): Promise<ActionResult> {
  const user = await requireCurrentUser();

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return { ok: false, error: "Pesan tidak ditemukan." };
  if (message.senderId !== user.id) return { ok: false, error: "Kamu tidak berhak menghapus pesan ini." };

  if (!message.deletedForIds.includes(user.id)) {
    await prisma.message.update({
      where: { id: messageId },
      data: { deletedForIds: { push: user.id } },
    });
  }

  revalidatePath("/messages/[username]", "layout");
  return { ok: true };
}

export async function deleteMessageForAll(messageId: string): Promise<ActionResult> {
  const user = await requireCurrentUser();

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return { ok: false, error: "Pesan tidak ditemukan." };
  if (message.senderId !== user.id) return { ok: false, error: "Kamu tidak berhak menghapus pesan ini." };
  if (message.deletedAt) return { ok: false, error: "Pesan sudah dihapus untuk semua." };

  const age = Date.now() - message.createdAt.getTime();
  if (age > EDIT_DELETE_WINDOW_MS) {
    return { ok: false, error: "Waktu hapus untuk semua habis — hanya bisa dalam 10 menit setelah pesan dikirim." };
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: "" },
  });

  revalidatePath("/messages/[username]", "layout");
  return { ok: true };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await requireCurrentUser();
  await findConversationForUserOrThrow(conversationId, user.id);

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/messages");
}

export async function blockUser(targetId: string): Promise<ActionResult> {
  const user = await requireCurrentUser();
  if (user.id === targetId) return { ok: false, error: "Tidak bisa memblokir diri sendiri." };

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { ok: false, error: "Pengguna tidak ditemukan." };

  await prisma.blockedUser.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetId } },
    update: {},
    create: { blockerId: user.id, blockedId: targetId },
  });

  revalidatePath("/messages");
  return { ok: true };
}

export async function unblockUser(targetId: string): Promise<ActionResult> {
  const user = await requireCurrentUser();

  await prisma.blockedUser.deleteMany({
    where: { blockerId: user.id, blockedId: targetId },
  });

  revalidatePath("/messages");
  return { ok: true };
}

export async function checkBlocked(meId: string, otherId: string): Promise<boolean> {
  const iBlockedThem = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId: meId, blockedId: otherId } },
  });
  const theyBlockedMe = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId: otherId, blockedId: meId } },
  });
  return !!(iBlockedThem || theyBlockedMe);
}

export async function clearChat(conversationId: string): Promise<ActionResult> {
  const user = await requireCurrentUser();
  await findConversationForUserOrThrow(conversationId, user.id);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    select: { id: true, deletedForIds: true },
  });

  for (const msg of messages) {
    if (!msg.deletedForIds.includes(user.id)) {
      await prisma.message.update({
        where: { id: msg.id },
        data: { deletedForIds: { push: user.id } },
      });
    }
  }

  revalidatePath("/messages");
  revalidatePath("/messages/[username]", "layout");
  return { ok: true };
}