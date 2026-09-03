import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDiagnosticBySlug } from "@/lib/queries";
import { CommentBox, type CommentItem } from "@/components/comment-box";
import { DiagnosticActions } from "@/components/diagnostic-actions";
import { LikeButton } from "@/components/like-button";
import { toggleDiagnosticLike } from "../actions";
import { sanitizeHtml } from "@/lib/dompurify";
import { ChevronRight, CalendarDays, MessageSquare, ArrowLeft, Wrench } from "lucide-react";

function toCommentItem(
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    parentId?: string | null;
    author?: { id: string; name: string | null; username: string | null; titles: string[]; avatarUrl: string | null; image: string | null; score: number } | null;
    likes?: { id: string }[];
    _count?: { likes?: number };
  },
  hasViewer: boolean
): CommentItem {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    parentId: comment.parentId ?? null,
    likesCount: comment._count?.likes ?? comment.likes?.length ?? 0,
    likedByMe: hasViewer ? (comment.likes?.length ?? 0) > 0 : false,
    author: comment.author
      ? {
          id: comment.author.id,
          name: comment.author.name,
          username: comment.author.username,
          titles: comment.author.titles,
          avatarUrl: comment.author.avatarUrl,
          image: comment.author.image,
          score: comment.author.score,
        }
      : null,
  };
}

export default async function DiagnosticDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  const viewer = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;

  const diagnostic = await getDiagnosticBySlug(slug, viewer?.id ?? null);
  if (!diagnostic) notFound();

  const user = viewer;
  const canManage = !!user && (user.id === diagnostic.authorId || user.role === "admin");

  const hasViewer = !!viewer;
  const comments = diagnostic.comments.filter((c) => !c.parentId).map((c) => toCommentItem(c, hasViewer));
  const replies = diagnostic.comments.flatMap((c) => c.replies.map((r) => toCommentItem(r, hasViewer)));
  const allComments = [...comments, ...replies].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        username: session.user.username ?? null,
        avatarUrl: session.user.avatarUrl ?? null,
        image: session.user.image ?? null,
        role: session.user.role ?? "user",
      }
    : null;

  const likeCount = diagnostic._count.likes;
  const likedByMe = hasViewer ? (diagnostic.likes?.length ?? 0) > 0 : false;

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mb-8">
        <Link href="/" className="hover:text-zinc-950 transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/diagnostics" className="hover:text-zinc-950 transition-colors">
          Forum Diagnosa
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-700 truncate max-w-[220px]">{diagnostic.title}</span>
      </nav>

      {/* Thread Header */}
      <header className="space-y-5 pb-8 border-b border-zinc-200 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-md uppercase tracking-wider">
            <Wrench className="h-3.5 w-3.5" />
            Kasus Diagnosa
          </span>
          <DiagnosticActions
            id={diagnostic.id}
            slug={diagnostic.slug}
            canManage={canManage}
          />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 leading-tight">
          {diagnostic.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold uppercase font-mono">
              {(diagnostic.author?.name || diagnostic.author?.email || "T")[0]}
            </span>
            Dibuka oleh{" "}
            {diagnostic.author?.username ? (
              <Link href={`/users/${diagnostic.author.username}`} className="font-semibold text-zinc-900 hover:underline">
                {diagnostic.author.name || diagnostic.author.username}
              </Link>
            ) : (
              diagnostic.author?.name || diagnostic.author?.email || "Teknisi"
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
            {new Date(diagnostic.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400 font-mono">
            <MessageSquare className="h-3.5 w-3.5" />
            {allComments.length} tanggapan
          </span>
          <LikeButton
            id={diagnostic.id}
            initialCount={likeCount}
            initialLiked={likedByMe}
            toggle={toggleDiagnosticLike}
          />
        </div>
      </header>

      {/* Body */}
      <article
        className="rm-prose"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(diagnostic.content) }}
      />

      {/* Comments */}
      <section className="mt-12 pt-8 border-t border-zinc-200">
        <CommentBox diagnosticId={diagnostic.id} initialComments={allComments} currentUser={currentUser} />
      </section>

      {/* Bottom CTA */}
      <div className="mt-12 pt-8 border-t border-zinc-200">
        <Link
          href="/diagnostics"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke forum diagnosa
        </Link>
      </div>
    </main>
  );
}
