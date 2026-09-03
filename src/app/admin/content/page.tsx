import { prisma } from "@/lib/prisma";
import { ContentClient, GuideItem, DiagnosticItem } from "./content-client";

export default async function AdminContentPage() {
  const [dbGuides, dbDiagnostics] = await Promise.all([
    prisma.guide.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        viewsCount: true,
        createdAt: true,
        author: { select: { name: true, username: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.diagnostic.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        author: { select: { name: true, username: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
  ]);

  const guides: GuideItem[] = dbGuides.map((g) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    category: g.category,
    viewsCount: g.viewsCount,
    likesCount: g._count.likes,
    createdAt: g.createdAt.toISOString(),
    author: g.author,
  }));

  const diagnostics: DiagnosticItem[] = dbDiagnostics.map((d) => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    commentsCount: d._count.comments,
    likesCount: d._count.likes,
    createdAt: d.createdAt.toISOString(),
    author: d.author,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">Content</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tinjau dan kelola konten komunitas.
        </p>
      </div>

      <ContentClient guides={guides} diagnostics={diagnostics} />
    </div>
  );
}
