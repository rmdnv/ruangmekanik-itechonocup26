"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthorAvatar } from "@/components/author-avatar";
import { InboxLive } from "@/components/inbox-live";
import { Search, MessageSquare, ShieldCheck } from "lucide-react";

export interface InboxItem {
  id: string;
  href: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  image: string | null;
  lastText: string;
  timeLabel: string;
  unread: boolean;
  unreadCount: number;
  blocked: boolean;
}

function ConversationRow({ item, active }: { item: InboxItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 px-3 py-2.5 transition-colors ${
        active ? "bg-zinc-100" : "hover:bg-zinc-50"
      }`}
    >
      <div className="relative shrink-0">
        <div className={item.blocked ? "opacity-40" : ""}>
          <AuthorAvatar
            author={{ name: item.name, username: item.username, avatarUrl: item.avatarUrl, image: item.image }}
            size="sm"
          />
        </div>
        {item.unread && !item.blocked && (
          <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-zinc-950 ring-2 ring-white" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-sm ${item.unread && !item.blocked ? "font-semibold text-zinc-950" : item.blocked ? "text-zinc-400" : "text-zinc-800"}`}>
            {item.name}
          </p>
          {item.blocked && (
            <ShieldCheck className="h-3 w-3 shrink-0 text-red-400" />
          )}
          {!item.blocked && item.timeLabel && (
            <span className="shrink-0 text-[10px] font-mono text-zinc-400">{item.timeLabel}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p className={`truncate text-xs ${item.blocked ? "text-zinc-400 italic" : item.unread ? "font-medium text-zinc-700" : "text-zinc-500"}`}>
            {item.blocked ? "Diblokir" : item.lastText}
          </p>
          {item.unreadCount > 0 && !item.blocked && (
            <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-zinc-950 px-1 text-[9px] font-bold text-white">
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function MessagesShell({
  items,
  children,
}: {
  items: InboxItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const activeUsername = useMemo(() => {
    const match = pathname.match(/^\/messages\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [pathname]);

  const isHome = pathname === "/messages";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.name} ${item.username}`.toLowerCase().includes(q));
  }, [items, query]);

  const totalUnread = items.reduce((sum, item) => sum + item.unreadCount, 0);

  return (
    <>
      <InboxLive />
      <div className="flex h-[calc(100dvh-4rem)] md:h-[calc(100dvh-4rem)] border border-zinc-200 bg-white overflow-hidden md:rounded-2xl">
        {/* Sidebar */}
        <div
          className={`w-full md:w-[340px] md:min-w-[340px] border-r border-zinc-100 flex flex-col bg-white ${
            isHome ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-950">Pesan</h2>
            {totalUnread > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[10px] font-bold text-white">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Cari"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <MessageSquare className="h-8 w-8 text-zinc-300" />
                <p className="text-xs text-zinc-500">
                  {query.trim() ? "Tidak ada hasil." : "Belum ada percakapan."}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((item) => (
                  <ConversationRow
                    key={item.id}
                    item={item}
                    active={item.username === activeUsername}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            isHome ? "hidden md:flex" : "flex"
          }`}
        >
          {isHome && (
            <div className="hidden md:flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                <MessageSquare className="h-7 w-7 text-zinc-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-zinc-700">Pilih percakapan</p>
              <p className="mt-1 text-xs text-zinc-400">
                Kirim pesan ke mekanik lain dari profil mereka.
              </p>
            </div>
          )}
          {!isHome && children}
        </div>
      </div>
    </>
  );
}
