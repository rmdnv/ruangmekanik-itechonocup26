import Link from "next/link";
import { auth } from "@/auth";
import { getLatestGuides, getLatestDiagnostics } from "@/lib/queries";
import { LikeButton } from "@/components/like-button";
import { toggleGuideLike } from "./guides/actions";
import { toggleDiagnosticLike } from "./diagnostics/actions";
import { ArrowRight, BookOpen, MessageSquare, ChevronRight } from "lucide-react";
import { sanitizeHtml } from "@/lib/dompurify";

export default async function Home() {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const [guides, diagnostics] = await Promise.all([
    getLatestGuides(viewerId),
    getLatestDiagnostics(viewerId),
  ]);

  return (
    <main className="bg-white text-zinc-950 min-h-screen">
      {/* Hero Section */}
      <section className="relative border-b border-zinc-200/80 bg-zinc-50/40 py-16 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-8 h-56 w-56 rounded-full border border-zinc-200/80" />
          <div className="absolute right-0 top-20 h-72 w-72 rounded-full border border-zinc-200/70" />
          <div className="absolute left-1/2 top-10 h-px w-[55vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
          <svg className="absolute left-0 top-20 hidden h-80 w-full lg:block" viewBox="0 0 1200 320" fill="none" aria-hidden="true">
            <path d="M0 220C140 120 240 120 360 180C490 245 620 255 760 186C910 112 1020 96 1200 170" stroke="#d4d4d8" strokeWidth="1.2" strokeDasharray="6 8" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-8 relative">
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 leading-[1.05] font-sans">
                <span className="block">Tempat teknisi</span>
                <span className="block">
                  membaca gejala, <span className="inline-block rounded-full border border-zinc-200 bg-zinc-100 px-3 py-0.5 font-medium text-zinc-700">menelusuri sebab</span>,
                </span>
                <span className="block text-zinc-600">lalu merapikan diagnosa dengan jelas.</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl">
                Panduan, kasus, dan tanggapan teknis dikumpulkan dalam alur yang lebih tenang, mudah dibaca ulang, dan tetap berguna saat mesin mulai bermasalah lagi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/guides"
                className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-6 py-3.5 rounded-full shadow-sm transition-all inline-flex items-center gap-2"
              >
                <span>Eksplorasi Panduan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/diagnostics"
                className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-xs font-semibold px-6 py-3.5 rounded-full shadow-2xs transition-all inline-flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4 text-zinc-500" />
                <span>Forum Diagnosa</span>
              </Link>
            </div>

            <div className="grid gap-4 pt-4 sm:grid-cols-2 max-w-2xl">
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-2xs">
                <div className="text-2xl font-bold font-mono text-zinc-950">{guides.length}</div>
                <div className="text-xs text-zinc-500 font-medium">Panduan aktif</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-2xs">
                <div className="text-2xl font-bold font-mono text-zinc-950">{diagnostics.length}</div>
                <div className="text-xs text-zinc-500 font-medium">Kasus diagnosa</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Guides Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-950">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-zinc-950">Panduan Perbaikan Terbaru</h2>
              </div>
              <Link href="/guides" className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors flex items-center gap-1">
                Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {guides.length === 0 ? (
                <div className="text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl p-8 text-center">
                  Belum ada panduan terdaftar.
                </div>
              ) : (
                guides.slice(0, 3).map((guide) => (
                  <div key={guide.id} className="group border border-zinc-200 rounded-xl p-5 bg-white shadow-2xs hover:shadow-md hover:border-zinc-400 transition-all space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="bg-zinc-100 border border-zinc-200 text-zinc-800 px-2 py-0.5 rounded font-sans font-semibold text-[11px]">
                        {guide.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <LikeButton
                          id={guide.id}
                          initialCount={guide._count.likes}
                          initialLiked={(guide.likes?.length ?? 0) > 0}
                          toggle={toggleGuideLike}
                          className="px-2 py-0.5 border-zinc-200 [&>span:last-child]:text-[10px]"
                        />
                        <span className="text-zinc-400">
                          {new Date(guide.createdAt).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-zinc-950 group-hover:text-zinc-700 transition-colors">
                      <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                    </h3>

                    <div
                      className="text-xs text-zinc-600 line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content) }}
                    />

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">
                        Penulis:{" "}
                        {guide.author?.username ? (
                          <Link href={`/users/${guide.author.username}`} className="hover:underline text-zinc-700">
                            {guide.author.name || guide.author.username}
                          </Link>
                        ) : (
                          guide.author?.name || guide.author?.email || "Mekanik"
                        )}
                      </span>
                      <Link href={`/guides/${guide.slug}`} className="font-semibold text-zinc-950 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                        <span>Baca Selengkapnya</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diagnostics Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-950">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-zinc-950">Forum Diagnosa Aktif</h2>
              </div>
              <Link href="/diagnostics" className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors flex items-center gap-1">
                Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {diagnostics.length === 0 ? (
                <div className="text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl p-8 text-center">
                  Belum ada diskusi diagnosa.
                </div>
              ) : (
                diagnostics.slice(0, 3).map((item) => (
                  <div key={item.id} className="group border border-zinc-200 rounded-xl p-5 bg-white shadow-2xs hover:shadow-md hover:border-zinc-400 transition-all space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span className="text-zinc-700 font-medium font-sans">
                        Oleh:{" "}
                        {item.author?.username ? (
                          <Link href={`/users/${item.author.username}`} className="hover:underline">
                            {item.author.name || item.author.username}
                          </Link>
                        ) : (
                          item.author?.name || item.author?.email || "Teknisi"
                        )}
                      </span>
                      <span>{item.comments?.length || 0} Tanggapan</span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-950 group-hover:text-zinc-700 transition-colors">
                      <Link href={`/diagnostics/${item.slug}`}>{item.title}</Link>
                    </h3>

                    <LikeButton
                      id={item.id}
                      initialCount={item._count.likes}
                      initialLiked={(item.likes?.length ?? 0) > 0}
                      toggle={toggleDiagnosticLike}
                    />

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-mono">{new Date(item.createdAt).toLocaleDateString("id-ID")}</span>
                      <Link href={`/diagnostics/${item.slug}`} className="font-semibold text-zinc-950 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                        <span>Diskusi & Solusi</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
