import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getInbox, otherUser } from "@/lib/messaging";
import { MessagesShell, type InboxItem } from "@/components/messages-shell";

function timeLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((startToday - day) / 86400000);
  if (diff <= 0) return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Kemarin";
  if (diff < 7) return date.toLocaleDateString("id-ID", { weekday: "short" });
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin");

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) redirect("/auth/signin");

  const inbox = await getInbox(me.id);

  const blockedIds = await prisma.blockedUser.findMany({
    where: {
      OR: [
        { blockerId: me.id },
        { blockedId: me.id },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedSet = new Set<string>();
  for (const b of blockedIds) {
    blockedSet.add(b.blockerId === me.id ? b.blockedId : b.blockerId);
  }

  const items: InboxItem[] = inbox.map((conversation) => {
    const other = otherUser(conversation, me.id);
    const last = conversation.messages[0];
    const lastIsMine = last ? last.senderId === me.id : false;
    const unreadCount = conversation._count ? conversation._count.messages : 0;
    const unread = unreadCount > 0;
    const isBlocked = blockedSet.has(other.id);

    let lastText = "Mulai percakapan.";
    if (last) {
      if (last.deletedAt) lastText = "Pesan dihapus";
      else if (lastIsMine) lastText = last.content ? `Kamu: ${last.content}` : "Pesan dihapus";
      else lastText = last.content ?? "Pesan dihapus";
    }

    return {
      id: conversation.id,
      href: `/messages/${other.username || other.id}`,
      name: other.name || other.username || "Pengguna",
      username: other.username || other.id,
      avatarUrl: other.avatarUrl,
      image: other.image,
      lastText,
      timeLabel: last ? timeLabel(last.createdAt.toISOString()) : "",
      unread,
      unreadCount,
      blocked: isBlocked,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <MessagesShell items={items}>
        {children}
      </MessagesShell>
    </div>
  );
}
