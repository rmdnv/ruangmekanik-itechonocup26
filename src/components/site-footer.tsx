import Link from "next/link";
import { BookOpen, MessageSquare, ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/50 text-zinc-600 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-zinc-200/80">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="RuangMekanik" className="h-14 w-auto brightness-0" />
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Repositori terbuka dan forum diagnosa teknik untuk pencatatan manual pemeliharaan, analisa masalah mesin, serta manajemen alat kerja.
            </p>
          </div>

          {/* Nav Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/guides" className="hover:text-zinc-950 transition-colors flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-zinc-400" /> Panduan Perbaikan
                </Link>
              </li>
              <li>
              <Link href="/diagnostics" className="hover:text-zinc-950 transition-colors flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-zinc-400" /> Forum Diagnosa
              </Link>
            </li>
            </ul>
          </div>

          {/* Account Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
              Akun & Akses
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/auth/signin" className="hover:text-zinc-950 transition-colors flex items-center gap-1">
                  Masuk Sistem <ArrowUpRight className="h-3 w-3 text-zinc-400" />
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="hover:text-zinc-950 transition-colors flex items-center gap-1">
                  Daftar Akun Baru <ArrowUpRight className="h-3 w-3 text-zinc-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-mono">
          <p>© {new Date().getFullYear()} RuangMekanik. Hak Cipta Dilindungi.</p>
          <p className="text-[11px]">Dibangun untuk komunitas teknik.</p>
        </div>
      </div>
    </footer>
  );
}
