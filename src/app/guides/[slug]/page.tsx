import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/queries";
import { sanitizeHtml } from "@/lib/dompurify";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GuideActions } from "@/components/guide-actions";
import { LikeButton } from "@/components/like-button";
import { toggleGuideLike } from "../actions";
import { BookOpen, CalendarDays, ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  const viewer = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;

  const guide = await getGuideBySlug(slug, viewer?.id ?? null);
  if (!guide) notFound();

  const canManage = !!viewer && (viewer.id === guide.authorId || viewer.role === "admin");

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mb-8">
        <Link href="/" className="hover:text-zinc-950 transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/guides" className="hover:text-zinc-950 transition-colors">
          Panduan
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-700 truncate max-w-[220px]">{guide.title}</span>
      </nav>

      {/* Header */}
      <header className="space-y-5 pb-8 border-b border-zinc-200 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-md uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5" />
            {guide.category}
          </span>
          <GuideActions id={guide.id} slug={guide.slug} canManage={canManage} />
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-zinc-950 leading-tight">
          {guide.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
          {guide.author?.username ? (
            <Link
              href={`/users/${guide.author.username}`}
              className="inline-flex items-center gap-1.5 font-semibold text-zinc-900 hover:underline"
            >
              <span className="h-6 w-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold uppercase font-mono">
                {(guide.author?.name || guide.author?.email || "M")[0]}
              </span>
              {guide.author?.name || guide.author?.email || "Mekanik Terverifikasi"}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold uppercase font-mono">
                {(guide.author?.name || guide.author?.email || "M")[0]}
              </span>
              {guide.author?.name || guide.author?.email || "Mekanik Terverifikasi"}
            </span>
          )}
          {(guide.author?.titles ?? []).map((t) => (
            <span key={t} className="inline-flex items-center rounded-full bg-zinc-900 text-white text-[10px] font-medium px-2 py-0.5">
              {t}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
            {new Date(guide.createdAt).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <LikeButton
            id={guide.id}
            initialCount={guide._count.likes}
            initialLiked={(guide.likes?.length ?? 0) > 0}
            toggle={toggleGuideLike}
          />
        </div>
      </header>

      {/* Article */}
      <article
        className="rm-prose"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content) }}
      />

      {/* Bottom CTA */}
      <div className="mt-14 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke semua panduan
        </Link>
        <div className="text-xs text-zinc-400 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Dipublikasikan di RuangMekanik
        </div>
      </div>
    </main>
  );
}