import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import {
  getUserActivity,
  getUserByUsername,
  getUserStats,
} from "@/lib/queries";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { ReportDialog } from "@/components/report-dialog";
import { AuthorAvatar } from "@/components/author-avatar";
import {
  BookOpen,
  MessageSquare,
  Star,
  CalendarDays,
  PenLine,
  ChevronRight,
  MessagesSquare,
  UserRound,
  Ban,
  Send,
  ThumbsUp,
} from "lucide-react";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const session = await auth();
  const viewerId = session?.user?.id;
  const isSelf = !!viewerId && viewerId === user.id;

  const [activity, stats] = await Promise.all([
    getUserActivity(user.id),
    getUserStats(user.id),
  ]);

  const joined = new Date(user.createdAt).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
        <Link href="/" className="hover:text-zinc-950 transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-700">@{username}</span>
      </nav>

      {user.banned && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-5">
          <Ban className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-800">Akun ini telah dibekukan oleh admin</p>
            {user.bannedReason && (
              <p className="text-xs text-red-700 leading-relaxed">
                Alasan: <span className="font-medium">{user.bannedReason}</span>
              </p>
            )}
            <p className="text-[11px] text-red-500">
              Pengguna ini tidak dapat masuk atau memberikan tanggapan baru selama masa pembekuan.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-zinc-200 rounded-3xl bg-white p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <AuthorAvatar
              author={{ name: user.name, username: user.username, avatarUrl: user.avatarUrl, image: user.image }}
              size="xl"
            />
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">
                  {user.name || "Anggota"}
                </h1>
                {(user.titles ?? []).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-zinc-950 text-white text-[11px] font-medium px-3 py-1">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-sm font-mono text-zinc-400">@{user.username}</p>
              {user.bio ? (
                <p className="text-sm text-zinc-600 leading-relaxed max-w-xl">{user.bio}</p>
              ) : (
                <p className="text-sm text-zinc-400 italic">Belum ada bio.</p>
              )}
              <p className="inline-flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Bergabung {joined}
              </p>
            </div>
          </div>

          {isSelf && (
            <div className="pt-5 border-t border-zinc-100">
              <ProfileEditForm
                profile={{
                  name: user.name,
                  username: user.username,
                  bio: user.bio,
                  avatarUrl: user.avatarUrl,
                }}
              />
            </div>
          )}

          {viewerId && !isSelf && (
            <div className="pt-5 border-t border-zinc-100 flex flex-wrap items-center gap-3">
              {user.username && (
                <Link
                  href={`/messages/${user.username}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2.5 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  Kirim Pesan
                </Link>
              )}
              <ReportDialog
                reportedId={user.id}
                reportedName={user.name || user.username || "pengguna"}
                triggerLabel="Laporkan Pengguna"
                triggerClassName="inline-flex items-center gap-1.5 border border-zinc-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:border-red-400 hover:text-red-600 transition-all"
              />
            </div>
          )}
        </div>

        {/* Right: score & stats */}
        <div className="space-y-4">
          <div className="border border-zinc-200 rounded-3xl bg-zinc-950 text-white p-6 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <Star className="h-4 w-4 fill-white" />
                Skor Kontribusi
              </span>
            </div>
            <div className="text-4xl font-extrabold font-mono tracking-tight">{user.score}</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Poin naik setiap berkontribusi: menulis panduan (+10), membuka kasus (+5), menanggapi (+2), dan membalas (+3).
            </p>
            <div className="pt-3 border-t border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 inline-flex items-center gap-1.5">
                  <ThumbsUp className="h-3 w-3" />
                  Like Diterima
                </span>
                <span className="text-sm font-mono font-semibold text-white">{stats.totalLikes}</span>
              </div>
              <p className="text-[10px] font-mono text-zinc-500">
                Panduan {stats.guideLikes} · Kasus {stats.diagnosticLikes} · Tanggapan {stats.commentLikes}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatChip icon={<BookOpen className="h-3.5 w-3.5" />} value={stats.totalGuides} label="Panduan" />
            <StatChip icon={<MessageSquare className="h-3.5 w-3.5" />} value={stats.totalDiagnostics} label="Kasus" />
            <StatChip icon={<MessagesSquare className="h-3.5 w-3.5" />} value={stats.totalComments} label="Tanggapan" />
            <StatChip icon={<Star className="h-3.5 w-3.5" />} value={stats.totalActivity} label="Total Aktivitas" />
          </div>

        </div>
      </section>

      {/* Activity Heatmap */}
      <section>
        <ActivityHeatmap days={activity} />
      </section>

      {/* Contributions */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-200">
            <PenLine className="h-4 w-4" />
            <h2 className="text-sm font-bold text-zinc-950">Panduan &amp; Kasus Dibuat</h2>
          </div>

          {user.guides.length === 0 && user.diagnostics.length === 0 ? (
            <EmptyBox text="Belum ada panduan atau kasus yang dibuat." />
          ) : (
            <div className="space-y-3">
              {user.diagnostics.map((d) => (
                <ContributionRow
                  key={d.id}
                  kind="diagnostic"
                  title={d.title}
                  href={`/diagnostics/${d.slug}`}
                  meta={`${d._count.comments} tanggapan · ${new Date(d.createdAt).toLocaleDateString("id-ID")}`}
                />
              ))}
              {user.guides.map((g) => (
                <ContributionRow
                  key={g.id}
                  kind="guide"
                  title={g.title}
                  href={`/guides/${g.slug}`}
                  meta={`${g.category} · ${new Date(g.createdAt).toLocaleDateString("id-ID")}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-200">
            <UserRound className="h-4 w-4" />
            <h2 className="text-sm font-bold text-zinc-950">Tanggapan Terbaru</h2>
          </div>

          {user.comments.length === 0 ? (
            <EmptyBox text="Belum ada tanggapan yang diberikan." />
          ) : (
            <div className="space-y-3">
              {user.comments.map((c) => (
                <Link
                  key={c.id}
                  href={`/diagnostics/${c.diagnostic.slug}`}
                  className="block border border-zinc-200 rounded-xl bg-white p-4 hover:border-zinc-400 hover:shadow-md transition-all space-y-1.5"
                >
                  <p className="text-sm text-zinc-700 leading-relaxed line-clamp-2">{c.content}</p>
                  <p className="text-[11px] text-zinc-400 inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    pada &quot;{c.diagnostic.title}&quot; · {new Date(c.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="border border-zinc-200 rounded-2xl bg-white p-4 space-y-0.5 shadow-2xs">
      <div className="flex items-center gap-1.5 text-zinc-500">{icon}</div>
      <div className="text-2xl font-bold font-mono text-zinc-950">{value}</div>
      <div className="text-[11px] text-zinc-500 font-medium">{label}</div>
    </div>
  );
}

function ContributionRow({
  kind,
  title,
  href,
  meta,
}: {
  kind: "guide" | "diagnostic";
  title: string;
  href: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 border border-zinc-200 rounded-xl bg-white p-4 hover:border-zinc-400 hover:shadow-md transition-all"
    >
      <div
        className={`mt-0.5 h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${
          kind === "guide" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 border border-zinc-200"
        }`}
      >
        {kind === "guide" ? <BookOpen className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-zinc-950 truncate">{title}</p>
        <p className="text-[11px] text-zinc-400 font-mono">{meta}</p>
      </div>
    </Link>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-zinc-200 rounded-2xl p-10 text-center text-xs text-zinc-400">
      {text}
    </div>
  );
}
