"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function MessagesIcon({ initialUnread }: { initialUnread: number }) {
  const [count, setCount] = useState(initialUnread);

  useEffect(() => {
    const source = new EventSource("/api/messages/stream");
    const onInbox = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { unreadTotal: number };
        setCount(data.unreadTotal);
      } catch {
        /* ignore malformed */
      }
    };
    source.addEventListener("inbox", onInbox);
    return () => {
      source.close();
    };
  }, []);

  return (
    <Link
      href="/messages"
      aria-label="Pesan masuk"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 transition-colors shadow-2xs"
    >
      <MessageCircle className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center px-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}