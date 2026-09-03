import Link from "next/link";
import { BookOpenCheck, MessageSquare, ShieldCheck } from "lucide-react";

/**
 * Shared auth page shell matching the sign-in page's brand panel + centered form.
 */
export function AuthShell({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50/60 px-4 sm:px-6 py-12">
      <section className="w-full max-w-5xl grid lg:grid-cols-2 border border-zinc-200 rounded-3xl bg-white shadow-xl overflow-hidden">
        <div className="relative bg-zinc-950 text-white p-10 lg:p-12 hidden lg:flex flex-col justify-between space-y-10">
          <div className="flex items-center gap-2.5">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="RuangMekanik" className="h-14 w-auto brightness-0 invert" />
            </Link>
          </div>
          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Portal Teknisi &amp; Dokumentator Bengkel.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Akses satu pintu untuk menulis panduan perbaikan sekaligus membuka kasus diagnosa.
            </p>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <BookOpenCheck className="h-4 w-4 mt-0.5 shrink-0" />
                Dokumentasikan prosedur yang sudah terverifikasi.
              </li>
              <li className="flex items-start gap-2.5">
                <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                Diskusikan kendala mesin dengan rekan teknisi.
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                Data akun dilindungi secara aman.
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
            <BookOpenCheck className="h-3.5 w-3.5" />
            Keamanan akun dijaga
          </div>
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-[11px] font-mono text-zinc-700">
              {badge}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950">{title}</h2>
            {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
