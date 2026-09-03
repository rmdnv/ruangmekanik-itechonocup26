import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOpenReports, getResolvedReports } from "@/lib/queries";
import { resolveReport, banReportedUser } from "@/app/report/actions";
import { AuthorAvatar } from "@/components/author-avatar";
import { Flag, Inbox, ShieldCheck, CheckCircle2, MessageSquare, Clock3, Ban } from "lucide-react";

export default async function AdminReportsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const [open, resolved] = await Promise.all([
    getOpenReports(),
    getResolvedReports(),
  ]);

  const commentTexts = new Map<string, string>();
  const snippetIds = open
    .map((r) => r.commentId)
    .filter((c): c is string => !!c)
    .concat(resolved.map((r) => r.commentId).filter((c): c is string => !!c));

  if (snippetIds.length > 0) {
    const found = await prisma.diagnosticComment.findMany({
      where: { id: { in: snippetIds } },
      select: { id: true, content: true },
    });
    for (const c of found) commentTexts.set(c.id, c.content);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-zinc-200">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-[11px] font-mono text-zinc-700">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-950" />
            <span>Reports</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            User Reports
          </h1>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Review reports and take action when needed.
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 shrink-0">
          {open.length} pending
        </div>
      </header>

      {/* Open reports */}
      <section className="space-y-4">
        {open.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-2xl p-16 text-center space-y-2">
            <Inbox className="h-8 w-8 text-zinc-300 mx-auto" />
            <p className="text-sm text-zinc-500 font-medium">No reports.</p>
            <p className="text-xs text-zinc-400">Everything looks good.</p>
          </div>
        ) : (
          open.map((report) => (
            <ReportCard
              key={report.id}
              reported={report.reported}
              reporter={report.reporter}
              reason={report.reason}
              detail={report.detail}
              createdAt={report.createdAt}
commentSnippet={report.commentId ? commentTexts.get(report.commentId) : undefined}
              reportedBanned={report.reported.banned}
              reportedRole={report.reported.role}
              action={
                <div className="flex flex-col items-end gap-1.5">
                  {!report.reported.banned && report.reported.role !== "admin" && (
                    <form action={banReportedUser.bind(null, report.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 transition-all"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Ban User
                      </button>
                    </form>
                  )}
                  <form action={resolveReport.bind(null, report.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 transition-all"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolve
                    </button>
                  </form>
                </div>
              }
            />
          ))
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section className="space-y-3 pt-6 border-t border-zinc-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Resolved
          </h2>
          {resolved.slice(0, 10).map((report) => (
            <div key={report.id} className="flex items-start gap-3 border border-zinc-100 rounded-xl bg-zinc-50/60 p-4">
              <span className="mt-0.5 h-7 w-7 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center shrink-0">
                <Flag className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-zinc-600">
                  <span className="font-semibold text-zinc-900">{report.reported.name || report.reported.username}</span>{" "}
                  dilaporkan karena <span className="text-zinc-800 font-medium">“{report.reason}”</span>
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  ditangani {report.handler?.name || "oleh admin"} ·{" "}
                  {report.handledAt ? new Date(report.handledAt).toLocaleDateString("id-ID") : ""}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function ReportCard({
  reported,
  reporter,
  reason,
  detail,
  createdAt,
  commentSnippet,
  reportedBanned,
  reportedRole,
  action,
}: {
  reported: { name: string | null; username: string | null; avatarUrl: string | null; image: string | null };
  reporter: { name: string | null; username: string | null; avatarUrl: string | null; image: string | null };
  reason: string;
  detail: string | null;
  createdAt: Date;
  commentSnippet?: string;
  reportedBanned: boolean;
  reportedRole: string;
  action: React.ReactNode;
}) {
  const reportedHref = reported.username ? `/users/${reported.username}` : null;

  return (
    <article className="border border-zinc-200 rounded-2xl bg-white p-5 shadow-2xs space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <AuthorAvatar
            author={{ name: reported.name, username: reported.username, avatarUrl: reported.avatarUrl, image: reported.image }}
            size="md"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-bold text-zinc-950 truncate">
              {reportedHref ? (
                <Link href={reportedHref} className="hover:underline">
                  {reported.name || reported.username}
                </Link>
              ) : (
                reported.name || reported.username
              )}
            </p>
            <p className="text-[11px] font-mono text-zinc-400">@{reported.username}</p>
            {reportedBanned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white text-[10px] font-bold px-2 py-0.5">
                <Ban className="h-3 w-3" />
                Dibekukan
              </span>
            )}
            {reportedRole === "admin" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-300 text-zinc-600 text-[10px] font-bold px-2 py-0.5">
                Admin
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400">
            <Clock3 className="h-3 w-3" />
            {new Date(createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          {action}
        </div>
      </div>

      <div className="rounded-xl bg-red-50/70 border border-red-100 p-3.5 space-y-1">
        <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5" />
          {reason}
        </p>
        {detail ? <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">{detail}</p> : null}
      </div>

      {commentSnippet && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 flex items-start gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
            “{commentSnippet}”
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-400 inline-flex items-center gap-1.5">
        Dilaporkan oleh{" "}
        {reporter.username ? (
          <Link href={`/users/${reporter.username}`} className="font-medium text-zinc-600 hover:text-zinc-900 hover:underline">
            {reporter.name || reporter.username}
          </Link>
        ) : (
          reporter.name || "pengguna"
        )}
      </div>
    </article>
  );
}
