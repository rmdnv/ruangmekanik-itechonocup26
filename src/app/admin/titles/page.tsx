import { prisma } from "@/lib/prisma";
import { TitlesClient, MasterTitleItem } from "./titles-client";

export default async function AdminTitlesPage() {
  const [dbTitles, users] = await Promise.all([
    prisma.title.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { titles: true } }),
  ]);

  // Compute how many users currently have each title assigned
  const titleCounts = new Map<string, number>();
  for (const u of users) {
    for (const t of u.titles) {
      titleCounts.set(t, (titleCounts.get(t) || 0) + 1);
    }
  }

  const titles: MasterTitleItem[] = dbTitles.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt.toISOString(),
    usageCount: titleCounts.get(t.name) || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">Titles</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kelola daftar title yang tersedia untuk dipilih user.
        </p>
      </div>

      <TitlesClient titles={titles} />
    </div>
  );
}
