import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDiagnosticBySlug } from "@/lib/queries";
import { updateDiagnostic } from "@/app/diagnostics/actions";
import { DiagnosticForm } from "@/components/diagnostic-form";

export default async function DiagnosticEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const diagnostic = await getDiagnosticBySlug(slug);
  if (!diagnostic) notFound();

  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;
  if (!user || (user.id !== diagnostic.authorId && user.role !== "admin")) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="space-y-3 pb-6 border-b border-zinc-200 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Edit Topik Diagnosa</h1>
        <p className="text-sm text-zinc-500">
          Perbarui deskripsi kasus. Diskusi dan tanggapan tetap tersimpan.
        </p>
      </div>

      <DiagnosticForm
        action={updateDiagnostic.bind(null, diagnostic.id)}
        initial={{ title: diagnostic.title, content: diagnostic.content }}
      />
    </main>
  );
}