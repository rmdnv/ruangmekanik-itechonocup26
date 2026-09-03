"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthorAvatar } from "@/components/author-avatar";
import {
  sendMessage,
  editMessage,
  deleteMessageForMe,
  deleteMessageForAll,
  markConversationRead,
  blockUser,
  unblockUser,
  clearChat,
} from "@/app/messages/actions";
import { type ClientMessage, type ActionResult, EDIT_DELETE_WINDOW_MS } from "@/lib/messaging-types";
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCheck,
  Loader2,
  MoreVertical,
  Pencil,
  Send,
  ShieldOff,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

const GROUP_GAP_MS = 4 * 60 * 1000;

function errorOf(result: ActionResult): string | null {
  return result.ok ? null : result.error;
}

type Row =
  | { type: "day"; label: string }
  | { type: "message"; message: ClientMessage; grouped: boolean };

const urlRegex = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)/gi;

function renderMessageText(text: string, isMine: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(urlRegex)) {
    const index = match.index ?? 0;
    const url = match[0];
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));
    nodes.push(
      <a
        key={`${url}-${index}`}
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className={`underline underline-offset-2 ${
          isMine
            ? "text-zinc-300 decoration-zinc-500 hover:text-white hover:decoration-zinc-300"
            : "text-zinc-600 decoration-zinc-400 hover:text-zinc-900"
        }`}
      >
        {url}
      </a>
    );
    lastIndex = index + url.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length ? nodes : [text];
}

function dayLabel(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((startOfToday - d) / 86400000);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function buildRows(messages: ClientMessage[]): Row[] {
  const rows: Row[] = [];
  let prevSender: string | null = null;
  let prevTime = 0;
  let prevDay: string | null = null;
  for (const message of messages) {
    const date = new Date(message.createdAt);
    const day = date.toDateString();
    if (day !== prevDay) {
      rows.push({ type: "day", label: dayLabel(date) });
      prevSender = null;
      prevTime = 0;
      prevDay = day;
    }
    const grouped = message.senderId === prevSender && date.getTime() - prevTime < GROUP_GAP_MS;
    rows.push({ type: "message", message, grouped });
    prevSender = message.senderId;
    prevTime = date.getTime();
  }
  return rows;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function MessageThread({
  conversationId,
  myId,
  initialMessages,
  otherName,
  otherUserId,
  otherUsername,
  otherAvatarUrl,
  otherImage,
  otherBanned,
  iBlockedThem,
  theyBlockedMe,
}: {
  conversationId: string;
  myId: string;
  initialMessages: ClientMessage[];
  otherName: string;
  otherUserId: string;
  otherUsername: string;
  otherAvatarUrl: string | null;
  otherImage: string | null;
  otherBanned: boolean;
  iBlockedThem: boolean;
  theyBlockedMe: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ClientMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [blocked, setBlocked] = useState(iBlockedThem);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scrollRef = useRef<HTMLDivElement>(null);
  const markedFor = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const markRead = useCallback(() => {
    startTransition(async () => {
      try {
        await markConversationRead(conversationId);
      } catch {
        /* ignore */
      }
    });
  }, [conversationId]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.senderId !== myId && last.id !== markedFor.current) {
      markedFor.current = last.id;
      markRead();
    }
  }, [messages, myId, markRead]);

  useEffect(() => {
    const source = new EventSource("/api/messages/stream");
    const onChanged = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { conversationId: string; message: ClientMessage };
        if (payload.conversationId !== conversationId) return;
        const incoming = payload.message;
        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === incoming.id);
          if (index === -1) {
            if (incoming.deletedForIds.length > 0) return prev;
            return [...prev, incoming].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          }
          if (incoming.deletedForIds.length > 0) {
            const next = [...prev];
            next.splice(index, 1);
            return next;
          }
          const next = [...prev];
          next[index] = incoming;
          return next;
        });
      } catch {
        /* malformed */
      }
    };
    const onHidden = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { conversationId: string; messageId: string };
        if (payload.conversationId !== conversationId) return;
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      } catch {
        /* malformed */
      }
    };
    source.addEventListener("message.changed", onChanged);
    source.addEventListener("message.hidden", onHidden);
    return () => {
      source.removeEventListener("message.changed", onChanged);
      source.removeEventListener("message.hidden", onHidden);
      source.close();
    };
  }, [conversationId]);

  const handleSend = () => {
    const value = draft.trim();
    if (!value || isBlocked || otherBanned) return;
    const tmpId = `tmp-${crypto.randomUUID()}`;
    const tmp: ClientMessage = {
      id: tmpId,
      conversationId,
      senderId: myId,
      content: value,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      readAt: null,
      deletedForIds: [],
    };
    setMessages((prev) => [...prev, tmp]);
    setDraft("");
    setError(null);
    startTransition(async () => {
      const result = await sendMessage(conversationId, value);
      if (!result.ok) {
        if (result.error) setError(result.error);
        setMessages((prev) => prev.filter((m) => m.id !== tmpId));
        return;
      }
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tmpId);
        if (filtered.some((m) => m.id === result.message!.id)) return filtered;
        return [...filtered, result.message!].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      });
    });
  };

  const handleEditSave = (messageId: string, original: ClientMessage) => {
    const value = editDraft.trim();
    if (!value) return;
    if (value === original.content) {
      setEditingId(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await editMessage(messageId, value);
      if (!result.ok) {
        setError(errorOf(result));
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: value, editedAt: new Date().toISOString() } : m
        )
      );
      setEditingId(null);
    });
  };

  const handleDeleteForMe = (message: ClientMessage) => {
    setMenuId(null);
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    startTransition(async () => {
      const result = await deleteMessageForMe(message.id);
      if (!result.ok) {
        setError(errorOf(result));
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        );
      }
    });
  };

  const handleDeleteForAll = (message: ClientMessage) => {
    setMenuId(null);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id ? { ...m, deletedAt: new Date().toISOString(), content: null } : m
      )
    );
    startTransition(async () => {
      const result = await deleteMessageForAll(message.id);
      if (!result.ok) {
        setError(errorOf(result));
        setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      }
    });
  };

  const rows = buildRows(messages);

  const handleBlock = async () => {
    setHeaderMenuOpen(false);
    const result = await blockUser(otherUserId);
    if (!result.ok) setError(result.error);
    else setBlocked(true);
  };

  const handleUnblock = async () => {
    setHeaderMenuOpen(false);
    const result = await unblockUser(otherUserId);
    if (!result.ok) setError(result.error);
    else setBlocked(false);
  };

  const handleClearChat = async () => {
    setHeaderMenuOpen(false);
    setClearing(true);
    const result = await clearChat(conversationId);
    setClearing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessages([]);
  };

  const isBlocked = blocked || theyBlockedMe;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-zinc-100">
        <button
          type="button"
          onClick={() => router.push("/messages")}
          className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Link
          href={`/users/${otherUsername}`}
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
        >
          <AuthorAvatar
            author={{ name: otherName, username: otherUsername, avatarUrl: otherAvatarUrl, image: otherImage }}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-950">{otherName}</p>
            <p className="truncate text-[11px] font-mono text-zinc-400">
              @{otherUsername}
              {otherBanned ? " · dibekukan" : ""}
            </p>
          </div>
        </Link>

        {/* Header menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
            aria-label="Opsi"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {headerMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setHeaderMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                {blocked ? (
                  <button
                    type="button"
                    onClick={handleUnblock}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <ShieldOff className="h-3.5 w-3.5 text-zinc-400" />
                    Buka Blokir
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleBlock}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Blokir Pengguna
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={clearing || messages.length === 0}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                >
                  {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-zinc-400" />}
                  Hapus Percakapan
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {otherBanned && (
        <div className="flex items-center gap-2 bg-red-50 border-b border-red-100 px-4 py-2 text-xs text-red-600">
          <Ban className="h-3.5 w-3.5 shrink-0" />
          Akun ini dibekukan — tidak dapat menerima pesan.
        </div>
      )}

      {blocked && !otherBanned && (
        <div className="flex items-center gap-2 bg-red-50 border-b border-red-100 px-4 py-2 text-xs text-red-600">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {iBlockedThem ? "Kamu memblokir pengguna ini." : "Kamu diblokir oleh pengguna ini."}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {rows.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-400">
            Mulai percakapan.
          </div>
        ) : (
          rows.map((row, index) => {
            if (row.type === "day") {
              return (
                <div key={`day-${index}`} className="flex justify-center py-3">
                  <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-[10px] font-medium text-zinc-500">
                    {row.label}
                  </span>
                </div>
              );
            }
            const message = row.message;
            const isMine = message.senderId === myId;
            const isDeleted = !!message.deletedAt;
            const canEdit = isMine && !isDeleted;
            const canDeleteAll = isMine && !isDeleted;
            return (
              <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${row.grouped ? "mt-0.5" : "mt-2"}`}>
                {!isMine && (
                  <div className={`mr-2 shrink-0 self-end ${row.grouped ? "opacity-0" : "opacity-100"} transition-opacity`}>
                    <AuthorAvatar
                      author={{ name: otherName, username: otherUsername, avatarUrl: otherAvatarUrl, image: otherImage }}
                      size="xs"
                    />
                  </div>
                )}

                <div className={`group relative max-w-[75%]`}>
                  {isMine && !isDeleted && (
                    <div className={`absolute -top-1 right-1 z-20 ${menuId === message.id ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                      <button
                        type="button"
                        onClick={() => setMenuId(menuId === message.id ? null : message.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                        aria-label="Opsi pesan"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {menuId === message.id && isMine && !isDeleted && (
                    <div className="absolute z-30 top-4 right-0 mt-1 w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                      {canEdit && new Date().getTime() - new Date(message.createdAt).getTime() < EDIT_DELETE_WINDOW_MS && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuId(null);
                            setEditingId(message.id);
                            setEditDraft(message.content ?? "");
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteForMe(message)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <Check className="h-3.5 w-3.5 text-zinc-400" />
                        Hapus untuk saya
                      </button>
                      {canDeleteAll && new Date().getTime() - new Date(message.createdAt).getTime() < EDIT_DELETE_WINDOW_MS && (
                        <button
                          type="button"
                          onClick={() => handleDeleteForAll(message)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus untuk semua
                        </button>
                      )}
                    </div>
                  )}

                  {editingId === message.id ? (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3 w-72 shadow-lg space-y-2">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        autoFocus
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-zinc-400"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                        >
                          <X className="h-3 w-3" />
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditSave(message.id, message)}
                          disabled={isPending || !editDraft.trim()}
                          className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-40"
                        >
                          <Pencil className="h-3 w-3" />
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line break-words ${
                        isDeleted
                          ? "bg-zinc-50 text-zinc-400 italic text-xs"
                          : isMine
                            ? "bg-zinc-950 text-white rounded-br-md"
                            : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                      }`}
                    >
                      {isDeleted ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Trash2 className="h-3 w-3" />
                          Pesan dihapus
                        </span>
                      ) : (
                        <>
                          <p className="whitespace-pre-line break-words">{renderMessageText(message.content ?? "", isMine)}</p>
                          <div className={`mt-1 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] font-mono ${isMine ? "text-zinc-400" : "text-zinc-400"}`}>
                              {formatTime(message.createdAt)}
                              {message.editedAt && (
                                <span className="ml-1 normal-case">
                                  (diedit{" "}
                                  {new Date(message.editedAt).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  )
                                </span>
                              )}
                            </span>
                            {isMine &&
                              (message.readAt ? (
                                <CheckCheck className="h-3 w-3 text-zinc-400" aria-label="Dibaca" />
                              ) : (
                                <Check className="h-3 w-3 text-zinc-500" aria-label="Terkirim" />
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold hover:underline shrink-0">
            Tutup
          </button>
        </div>
      )}

      <div className="border-t border-zinc-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={isBlocked ? "Pesan tidak dapat dikirim" : otherBanned ? "Pesan tidak dapat dikirim" : "Pesan..."}
            disabled={isBlocked || otherBanned}
            className="max-h-24 flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none disabled:opacity-40"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending || !draft.trim() || isBlocked || otherBanned}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
            aria-label="Kirim pesan"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
