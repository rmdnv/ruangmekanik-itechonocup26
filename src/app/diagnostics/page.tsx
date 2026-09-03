import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { PageSkeleton } from "@/components/skeletons";
import { getLatestDiagnostics } from "@/lib/queries";
import { LikeButton } from "@/components/like-button";
import { toggleDiagnosticLike } from "./actions";
import { MessageSquare, ChevronRight, UserRound, PenLine, MessagesSquare, ArrowUpRight } from "lucide-react";

export default async function DiagnosticsPage() {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const diagnostics = await getLatestDiagnostics(viewerId);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-zinc-200">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-[11px] font-mono text-zinc-700">
            <MessageSquare className="h-3.5 w-3.5 text-zinc-950" />
            <span>Diskusi Terbuka</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            Forum Diagnosa & Troubleshooting
          </h1>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Sampaikan kendala lapangan, cek pengalaman teknisi lain, dan ambil solusi terbaik secara kolaboratif.
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 shrink-0">
          {diagnostics.length} kasus terbuka
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-10 mt-10 items-start">
        {/* Create CTA */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-zinc-950 text-white rounded-2xl p-6 space-y-4 shadow-lg">
            <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Buka Kasus Baru
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Deskripsikan gejala kerusakan disertai foto dan video agar diagnosa dari rekan teknisi semakin akurat.
            </p>
            <Link
              href="/diagnostics/new"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold uppercase tracking-widest px-5 py-3 transition-all"
            >
              Ajukan Kasus
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>

        {/* Listing */}
        <Suspense fallback={<PageSkeleton />}>
          {diagnostics.length === 0 ? (
            <div className="border border-dashed border-zinc-200 rounded-2xl p-16 text-center space-y-2">
              <MessageSquare className="h-8 w-8 text-zinc-300 mx-auto" />
              <p className="text-sm text-zinc-500 font-medium">Belum ada topik diagnosa.</p>
              <p className="text-xs text-zinc-400">Buka kasus pertama Anda dan mulai diskusi teknis.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {diagnostics.map((item) => (
                <article
                  key={item.id}
                  className="group border border-zinc-200 rounded-2xl p-6 bg-white shadow-2xs hover:shadow-lg hover:border-zinc-400 hover:-translate-y-0.5 transition-all duration-200 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md">
                      <MessagesSquare className="h-3.5 w-3.5 text-zinc-500" />
                      {item.comments?.length || item._count.comments || 0} tanggapan
                    </span>
                    <LikeButton
                      id={item.id}
                      initialCount={item._count.likes}
                      initialLiked={(item.likes?.length ?? 0) > 0}
                      toggle={toggleDiagnosticLike}
                      className="px-2.5 py-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-zinc-950 tracking-tight group-hover:text-zinc-700 transition-colors">
                      <Link href={`/diagnostics/${item.slug}`}>{item.title}</Link>
                    </h2>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-zinc-500 font-medium">
                      <UserRound className="h-3.5 w-3.5 text-zinc-400" />
                      {item.author?.username ? (
                        <Link href={`/users/${item.author.username}`} className="hover:underline text-zinc-700">
                          {item.author?.name || item.author?.username}
                        </Link>
                      ) : (
                        item.author?.name || item.author?.email || "Teknisi"
                      )}
                    </span>
                    <Link
                      href={`/diagnostics/${item.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-zinc-950 group-hover:gap-2 transition-all"
                    >
                      <span>Buka Diskusi</span>
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
