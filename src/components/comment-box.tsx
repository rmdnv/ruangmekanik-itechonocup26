"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addComment, addReply, toggleCommentLike, deleteComment, updateComment } from "@/app/diagnostics/actions";
import { AuthorAvatar } from "@/components/author-avatar";
import { RelativeTime } from "@/components/relative-time";
import { ReportDialog } from "@/components/report-dialog";
import { LikeButton } from "@/components/like-button";
import { MessageSquare, Send, Reply, Star, Share2, PencilLine, Trash2, MoreVertical } from "lucide-react";

export interface CommentAuthor {
  id?: string;
  name?: string | null;
  username?: string | null;
  titles?: string[];
  avatarUrl?: string | null;
  image?: string | null;
  score?: number;
  role?: string;
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  parentId?: string | null;
  author?: CommentAuthor | null;
  likesCount?: number;
  likedByMe?: boolean;
}

function displayName(author?: CommentAuthor | null) {
  return author?.name || author?.username || "Teknisi";
}

function profileHref(author?: CommentAuthor | null) {
  return author?.username ? `/users/${author.username}` : null;
}

async function submit(action: () => Promise<void>) {
  try {
    await action();
  } catch (e) {
    console.error(e);
  }
}

export function CommentBox({
  diagnosticId,
  initialComments,
  currentUser,
}: {
  diagnosticId: string;
  initialComments: CommentItem[];
  currentUser?: CommentAuthor | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(initialComments, (state: CommentItem[], next: CommentItem) => [
    ...state,
    next,
  ]);

  const [content, setContent] = useState("");
  const [replyDraft, setReplyDraft] = useState<{ parentId: string; content: string } | null>(null);
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const topLevel = optimistic.filter((c) => !c.parentId);
  const repliesOf = (parentId: string) =>
    optimistic.filter((c) => c.parentId === parentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const canReport = (comment: CommentItem) =>
    !!currentUser?.id && !!comment.author?.id && currentUser.id !== comment.author.id;

  const handleTopComment = () => {
    const value = content.trim();
    if (!value) return;
    addOptimistic({
      id: crypto.randomUUID(),
      content: value,
      createdAt: new Date().toISOString(),
      author: currentUser || null,
    });
    startTransition(async () => {
      await submit(() => addComment(diagnosticId, value));
      setContent("");
    });
  };

  const handleReply = (parentId: string) => {
    const value = replyDraft?.content.trim();
    if (!value) return;
    addOptimistic({
      id: crypto.randomUUID(),
      content: value,
      createdAt: new Date().toISOString(),
      parentId,
      author: currentUser || null,
    });
    startTransition(async () => {
      await submit(() => addReply(diagnosticId, parentId, value));
      setReplyDraft(null);
    });
  };

  const canManageComment = (comment: CommentItem) =>
    !!currentUser?.id && !!comment.author?.id && (currentUser.id === comment.author.id || currentUser.role === "admin");

  const handleDeleteComment = (id: string) => {
    startTransition(async () => {
      await submit(() => deleteComment(id));
      router.refresh();
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!editing?.content.trim()) return;
    startTransition(async () => {
      await submit(() => updateComment(id, editing.content));
      setEditing(null);
      router.refresh();
    });
  };

  const handleShareComment = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: document.title });
        window.alert("Komentar dibagikan");
      } else {
        await navigator.clipboard.writeText(url);
        window.alert("Link komentar disalin");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        window.alert("Link komentar disalin");
      } catch {
        console.error("Share failed");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <h2 className="flex items-center gap-2 text-base font-bold text-zinc-950">
          <MessageSquare className="h-4 w-4" />
          Tanggapan Teknis
          <span className="text-xs font-mono text-zinc-400 font-normal">({optimistic.length})</span>
        </h2>
      </div>

      {/* Composer */}
      <form
        action={() => {
          handleTopComment();
        }}
        className="space-y-3 border border-zinc-200 rounded-2xl bg-white p-5 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <AuthorAvatar author={currentUser} size="sm" />
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700">
            Tambahkan Tanggapan
          </label>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Tuliskan kemungkinan penyebab, pengalaman serupa, atau solusi yang pernah dicoba..."
          className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 resize-none focus:border-zinc-950 focus:outline-none transition"
        />
        <div className="flex justify-end">
          <button
            disabled={isPending || !content.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
            Kirim Tanggapan
          </button>
        </div>
      </form>

      {/* Thread */}
      <div className="space-y-4">
        {topLevel.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-2xl p-10 text-center">
            <MessageSquare className="h-7 w-7 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500 font-medium">Belum ada tanggapan.</p>
            <p className="text-xs text-zinc-400 mt-1">Mulai diskusi dengan menambahkan tanggapan pertama.</p>
          </div>
        ) : (
          topLevel.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <CommentCard
                comment={comment}
                onReply={setReplyDraft}
                replying={replyDraft?.parentId === comment.id}
                canReport={canReport(comment)}
                canManage={canManageComment(comment)}
                onEdit={() => setEditing({ id: comment.id, content: comment.content })}
                onDelete={() => handleDeleteComment(comment.id)}
                onShare={() => handleShareComment(comment.id)}
                isEditing={editing?.id === comment.id}
                editValue={editing?.id === comment.id ? editing.content : ""}
                setEditValue={(value) => setEditing((prev) => (prev?.id === comment.id ? { ...prev, content: value } : prev))}
                onSaveEdit={() => handleSaveEdit(comment.id)}
                onCancelEdit={() => setEditing(null)}
              />

              {/* Reply composer inline */}
              {replyDraft?.parentId === comment.id && (
                <div className="ml-12 space-y-2">
                  <textarea
                    autoFocus
                    rows={3}
                    value={replyDraft.content}
                    onChange={(e) => setReplyDraft({ parentId: comment.id, content: e.target.value })}
                    placeholder="Tulis balasan untuk tanggapan ini..."
                    className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 resize-none focus:border-zinc-950 focus:outline-none transition"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyDraft(null)}
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 px-3 py-2 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      disabled={isPending || !replyDraft.content.trim()}
                      onClick={() => handleReply(comment.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 transition-all disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                      Balas
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {repliesOf(comment.id).length > 0 && (
                <div className="ml-6 md:ml-12 space-y-3 border-l-2 border-zinc-100 pl-4">
                  {repliesOf(comment.id).map((reply) => (
                    <div key={reply.id} className="relative space-y-1">
                      <span className="absolute -left-7 top-4 h-px w-3 bg-zinc-200" />
                      <CommentCard
                        comment={reply}
                        onReply={setReplyDraft}
                        replying={false}
                        isReply
                        canReport={canReport(reply)}
                        canManage={canManageComment(reply)}
                        onEdit={() => setEditing({ id: reply.id, content: reply.content })}
                        onDelete={() => handleDeleteComment(reply.id)}
                        onShare={() => handleShareComment(reply.id)}
                        isEditing={editing?.id === reply.id}
                        editValue={editing?.id === reply.id ? editing.content : ""}
                        setEditValue={(value) => setEditing((prev) => (prev?.id === reply.id ? { ...prev, content: value } : prev))}
                        onSaveEdit={() => handleSaveEdit(reply.id)}
                        onCancelEdit={() => setEditing(null)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  onReply,
  replying,
  isReply = false,
  canReport = false,
  canManage = false,
  isEditing = false,
  editValue = "",
  setEditValue,
  onSaveEdit,
  onEdit,
  onDelete,
  onShare,
  onCancelEdit,
}: {
  comment: CommentItem;
  onReply: (draft: { parentId: string; content: string } | null) => void;
  replying: boolean;
  isReply?: boolean;
  canReport?: boolean;
  canManage?: boolean;
  isEditing?: boolean;
  editValue?: string;
  setEditValue: (value: string) => void;
  onSaveEdit: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onCancelEdit: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const href = profileHref(comment.author);
  const name = displayName(comment.author);
  const titles = comment.author?.titles ?? [];
  const score = comment.author?.score;

  return (
    <div
      id={`comment-${comment.id}`}
      className={`relative flex gap-3 border border-zinc-200 rounded-2xl bg-white p-4 pr-12 shadow-2xs transition-all ${
        replying ? "ring-2 ring-zinc-950" : ""
      } ${isReply ? "bg-zinc-50/60" : ""}`}
    >
      <button
        type="button"
        aria-label="Buka menu komentar"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuOpen ? (
        <div className="absolute right-3 top-11 z-20 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => {
              onShare();
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          {canManage && !isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onEdit();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {href ? (
        <Link href={href} className="shrink-0">
          <AuthorAvatar author={comment.author} size="sm" />
        </Link>
      ) : (
        <AuthorAvatar author={comment.author} size="sm" />
      )}

      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {href ? (
            <Link href={href} className="font-semibold text-zinc-950 hover:underline">
              {name}
            </Link>
          ) : (
            <span className="font-semibold text-zinc-950">{name}</span>
          )}

          {titles.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[10px] font-medium px-2 py-0.5">
              {t}
            </span>
          ))}

          {comment.author?.username && (
            <span className="font-mono text-zinc-400">@{comment.author.username}</span>
          )}

          {typeof score === "number" && score > 0 && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                score > 0 ? "bg-zinc-100 text-zinc-700" : "text-zinc-300"
              }`}
              title="Skor kontribusi"
            >
              <Star className={`h-3 w-3 ${score > 0 ? "fill-zinc-900 text-zinc-900" : ""}`} />
              {score}
            </span>
          )}

          <span className="text-zinc-300">•</span>
          <RelativeTime date={comment.createdAt} />
          {comment.editedAt && (
            <span className="text-[10px] text-zinc-500 ml-1">Diedit</span>
          )}
        </div>

        {!isEditing ? (
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{comment.content}</p>
        ) : (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 resize-none focus:border-zinc-950 focus:outline-none transition"
            />
            <div className="flex items-center gap-2">
              <button type="button" onClick={onSaveEdit} className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800">
                Simpan
              </button>
              <button type="button" onClick={() => setEditValue(comment.content)} className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100">
                Reset
              </button>
              <button type="button" onClick={onCancelEdit} className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-950">
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="pt-1 flex flex-wrap items-center gap-3">
          <LikeButton
            id={comment.id}
            initialCount={comment.likesCount ?? 0}
            initialLiked={comment.likedByMe ?? false}
            toggle={toggleCommentLike}
            className="px-2.5 py-1 [&>span:last-child]:text-[10px]"
          />
          {canReport && comment.author?.id ? (
            <ReportDialog
              reportedId={comment.author.id}
              reportedName={name}
              commentId={comment.id}
              triggerClassName="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-red-600 transition-colors"
            />
          ) : null}
          <button
            type="button"
            onClick={() => onReply(replying ? null : { parentId: comment.id, content: "" })}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <Reply className="h-3 w-3" />
            <span>{replying ? "Tutup" : "Balas"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
