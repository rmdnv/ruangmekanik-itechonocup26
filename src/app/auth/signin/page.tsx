import { AuthForm } from "@/components/auth-form";
import { Wrench, CheckCircle2, ShieldCheck, BookOpenCheck, MessageSquare } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50/60 px-4 sm:px-6 py-12">
      <section className="w-full max-w-5xl grid lg:grid-cols-2 border border-zinc-200 rounded-3xl bg-white shadow-xl overflow-hidden">
        {/* Left / Brand panel */}
        <div className="relative bg-zinc-950 text-white p-10 lg:p-12 hidden lg:flex flex-col justify-between space-y-10">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold tracking-tight">RuangMekanik</span>
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
            <CheckCircle2 className="h-3.5 w-3.5" />
            Menerima pendaftaran akun baru
          </div>
        </div>

        {/* Right / Form panel */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-[11px] font-mono text-zinc-700">
              <Wrench className="h-3.5 w-3.5 text-zinc-950" />
              Portal Akun
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950">
              Selamat Datang Kembali
            </h2>
            <p className="text-sm text-zinc-500">
              Masuk untuk melanjutkan atau daftar sebagai anggota baru.
            </p>
          </div>

          <AuthForm />
        </div>
      </section>
    </main>
  );
}