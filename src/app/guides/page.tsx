import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { getLatestGuides } from "@/lib/queries";
import { PageSkeleton } from "@/components/skeletons";
import { LikeButton } from "@/components/like-button";
import { toggleGuideLike } from "./actions";
import { sanitizeHtml } from "@/lib/dompurify";
import { BookOpen, ChevronRight, CalendarDays, UserRound, PenLine, Clock3, ArrowUpRight } from "lucide-react";

function readingTime(content: string) {
  const words = content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function GuidesPage() {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const guides = await getLatestGuides(viewerId);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-zinc-200">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-[11px] font-mono text-zinc-700">
            <BookOpen className="h-3.5 w-3.5 text-zinc-950" />
            <span>Manual & Prosedur</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            Panduan Perbaikan Teknis
          </h1>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Koleksi prosedur standar pemeliharaan, langkah penanganan komponen, dan kalibrasi yang terdokumentasi rapi untuk tim mekanik.
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 shrink-0">
          {guides.length} panduan terdokumentasi
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-10 mt-10 items-start">
        {/* Create CTA */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-zinc-950 text-white rounded-2xl p-6 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Tulis Panduan Baru
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Susun prosedur perbaikan langkah demi langkah, lengkap dengan foto dan video dari lapangan.
            </p>
            <Link
              href="/guides/new"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all"
            >
              Mulai Menulis
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>

        {/* Listing */}
        <Suspense fallback={<PageSkeleton />}>
          {guides.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-2xl p-16 text-center space-y-2">
              <BookOpen className="h-8 w-8 text-zinc-300 mx-auto" />
              <p className="text-sm text-zinc-500 font-medium">Belum ada panduan terdaftar.</p>
              <p className="text-xs text-zinc-400">Masuk akun untuk mendokumentasikan prosedur pertama.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {guides.map((guide) => (
                <article
                  key={guide.id}
                  className="group border border-zinc-200 rounded-2xl p-6 bg-white shadow-2xs hover:shadow-lg hover:border-zinc-400 hover:-translate-y-0.5 transition-all duration-200 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {guide.category}
                    </span>
                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
                      <LikeButton
                        id={guide.id}
                        initialCount={guide._count.likes}
                        initialLiked={(guide.likes?.length ?? 0) > 0}
                        toggle={toggleGuideLike}
                        className="px-2 py-0.5 border-zinc-200 [&>span:last-child]:text-[10px]"
                      />
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {readingTime(guide.content)} mnt baca
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(guide.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-zinc-950 tracking-tight group-hover:text-zinc-700 transition-colors">
                      <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                    </h2>
                    <div
                      className="text-sm text-zinc-600 line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content) }}
                    />
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-zinc-500 font-medium">
                      <UserRound className="h-3.5 w-3.5 text-zinc-400" />
                      {guide.author?.username ? (
                        <Link href={`/users/${guide.author.username}`} className="hover:underline text-zinc-700">
                          {guide.author?.name || guide.author?.username}
                        </Link>
                      ) : (
                        guide.author?.name || guide.author?.email || "Mekanik Terverifikasi"
                      )}
                    </span>
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-zinc-950 group-hover:gap-2 transition-all"
                    >
                      <span>Baca Panduan</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Suspense>
      </div>
    </main>
  );
}