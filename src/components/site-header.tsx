import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { countUnread } from "@/lib/messaging";
import { BookOpen, MessageSquare, PlusCircle } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { MessagesIcon } from "@/components/messages-icon";

export async function SiteHeader() {
  const session = await auth();

  let unreadCount = 0;

  if (session?.user?.email && !session.user.banned) {
    try {
      const me = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (me) unreadCount = await countUnread(me.id);
    } catch {
      unreadCount = 0;
    }
  }

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand & Main Nav */}
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="RuangMekanik" className="h-14 w-auto brightness-0" />
          </Link>

          <nav className="hidden md:flex items-center gap-1 border-l border-zinc-200 pl-6">
            <Link
              href="/guides"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 rounded-md hover:text-zinc-950 hover:bg-zinc-100 transition-all"
            >
              <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
              <span>Panduan</span>
            </Link>
            <Link
              href="/diagnostics"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 rounded-md hover:text-zinc-950 hover:bg-zinc-100 transition-all"
            >
              <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
              <span>Diagnosa</span>
            </Link>
          </nav>
        </div>

        {/* User Auth CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {session?.user && !session.user.banned ? (
            <>
              <MessagesIcon initialUnread={unreadCount} />
              <UserMenu
                user={{
                  name: session.user.name ?? null,
                  email: session.user.email ?? null,
                  username: session.user.username ?? null,
                  avatarUrl: session.user.avatarUrl ?? null,
                  image: session.user.image ?? null,
                  titles: session.user.titles ?? [],
                  score: session.user.score ?? 0,
                  role: session.user.role ?? "user",
                }}
                signOutAction={signOutAction}
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-950 px-3 py-2 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/auth/signin"
                className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Buat Akun</span>
              </Link>
            </div>
          )}
        </div>
        </div>
      </header>

      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-3 sm:px-6">
          <Link
            href="/guides"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
            Panduan
          </Link>
          <Link
            href="/diagnostics"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
            Diagnosa
          </Link>
        </div>
      </nav>
    </>
  );
}
