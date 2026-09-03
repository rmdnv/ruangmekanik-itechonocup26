import { prisma } from "@/lib/prisma";
import { canonicalPair } from "@/lib/messaging-types";

export {
  type ConversationUser,
  type ClientMessage,
  type ActionResult,
  type SendMessageResult,
} from "@/lib/messaging-types";

export { canonicalPair, otherUser, serializeMessageFor } from "@/lib/messaging-types";
export const MAX_MESSAGE = 2000;
export const EDIT_DELETE_WINDOW_MS = 10 * 60 * 1000;

export const conversationUserSelect = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
  image: true,
  titles: true,
} as const;

export async function getOrCreateConversation(a: string, b: string) {
  const { user1Id, user2Id } = canonicalPair(a, b);
  return prisma.conversation.upsert({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    update: {},
    create: { user1Id, user2Id },
    include: {
      user1: { select: conversationUserSelect },
      user2: { select: conversationUserSelect },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getInbox(userId: string) {
  return prisma.conversation.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      user1: { select: conversationUserSelect },
      user2: { select: conversationUserSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: {
          messages: { where: { readAt: null, senderId: { not: userId } } },
        },
      },
    },
  });
}

export async function countUnread(userId: string): Promise<number> {
  try {
    return await prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      },
    });
  } catch (error) {
    console.error("countUnread failed", error);
    return 0;
  }
}
