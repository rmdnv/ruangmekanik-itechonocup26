import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateConversation, otherUser, serializeMessageFor, type ClientMessage } from "@/lib/messaging";
import { MessageThread } from "@/components/message-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin");

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me || me.banned) redirect("/auth/signin");

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) notFound();

  if (target.id === me.id) redirect("/messages");

  const conversation = await getOrCreateConversation(me.id, target.id);
  const other = otherUser(conversation, me.id);

  const messages: ClientMessage[] = conversation.messages
    .map((message) => serializeMessageFor(message, me.id))
    .filter((m): m is ClientMessage => m !== null);

  const iBlockedThem = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId: target.id } },
  });
  const theyBlockedMe = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId: target.id, blockedId: me.id } },
  });

  return (
    <MessageThread
      conversationId={conversation.id}
      myId={me.id}
      initialMessages={messages}
      otherName={other.name || other.username || "Pengguna"}
      otherUserId={target.id}
      otherUsername={other.username || target.id}
      otherAvatarUrl={other.avatarUrl}
      otherImage={other.image}
      otherBanned={target.banned}
      iBlockedThem={!!iBlockedThem}
      theyBlockedMe={!!theyBlockedMe}
    />
  );
}
