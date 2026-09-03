"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthorAvatar } from "@/components/author-avatar";
import { ChevronDown, LogOut, UserRound, Star, MessageCircle, Settings } from "lucide-react";

export interface HeaderUser {
  name?: string | null;
  email?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  titles?: string[];
  score: number;
  role: string;
}

export function UserMenu({
  user,
  signOutAction,
}: {
  user: HeaderUser;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const profileHref = user.username ? `/users/${user.username}` : "/auth/signin";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 pl-1.5 pr-2.5 py-1.5 rounded-full shadow-2xs hover:border-zinc-400 transition-colors"
      >
        <AuthorAvatar
          author={{ name: user.name, username: user.username, avatarUrl: user.avatarUrl, image: user.image }}
          size="sm"
        />
        <span className="hidden sm:block text-xs font-semibold text-zinc-800 max-w-[120px] truncate">
          {user.name || user.username || user.email}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white shadow-xl p-2 z-50">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <AuthorAvatar
              author={{ name: user.name, username: user.username, avatarUrl: user.avatarUrl, image: user.image }}
              size="md"
            />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-bold text-zinc-950 truncate">{user.name || "Anggota"}</p>
              {user.titles && user.titles.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {user.titles.slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-full px-1.5 py-0.5 truncate max-w-[110px]">
                      {t}
                    </span>
                  ))}
                  {user.titles.length > 2 && (
                    <span className="text-[10px] font-mono text-zinc-400">+{user.titles.length - 2}</span>
                  )}
                </div>
              ) : null}
              {user.username ? (
                <p className="text-[11px] font-mono text-zinc-400 truncate">@{user.username}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 text-white">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-white" />
              Skor Kontribusi
            </span>
            <span className="font-mono font-bold">{user.score}</span>
          </div>

          <div className="mt-2 space-y-0.5 text-xs">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors font-medium"
            >
              <UserRound className="h-4 w-4 text-zinc-500" />
              Profil Saya
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors font-medium"
            >
              <Settings className="h-4 w-4 text-zinc-500" />
              Pengaturan Akun
            </Link>
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors font-medium"
            >
              <MessageCircle className="h-4 w-4 text-zinc-500" />
              Pesan Masuk
            </Link>
          </div>

          <form
            action={signOutAction}
            className="mt-1 pt-2 border-t border-zinc-100"
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
