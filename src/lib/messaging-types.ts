export const MAX_MESSAGE = 2000;
export const EDIT_DELETE_WINDOW_MS = 10 * 60 * 1000;

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type SendMessageResult =
  | { ok: true; message: ClientMessage }
  | { ok: false; error: string };

export type ConversationUser = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  image: string | null;
  titles: string[];
};

export type ClientMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  readAt: string | null;
  deletedForIds: string[];
};

export function serializeMessageFor(
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
    deletedForIds: string[];
    readAt: Date | null;
  },
  viewerId: string
): ClientMessage | null {
  if (message.deletedForIds.includes(viewerId)) return null;
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.deletedAt ? null : message.content,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    deletedAt: message.deletedAt?.toISOString() ?? null,
    readAt: message.readAt?.toISOString() ?? null,
    deletedForIds: message.deletedForIds,
  };
}

export function canonicalPair(a: string, b: string): { user1Id: string; user2Id: string } {
  return a < b ? { user1Id: a, user2Id: b } : { user1Id: b, user2Id: a };
}

export function otherUser(
  conversation: { user1Id: string; user2Id: string; user1: ConversationUser; user2: ConversationUser },
  selfId: string
): ConversationUser {
  return conversation.user1Id === selfId ? conversation.user2 : conversation.user1;
}
