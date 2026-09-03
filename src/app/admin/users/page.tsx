import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserTable, UserRow } from "./user-table";
import { getAllTitles } from "@/app/users/[username]/actions";

export default async function AdminUsersPage() {
  const session = await auth();
  const currentAdminId = session?.user?.id ?? "";

  const [dbUsers, availableTitles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        image: true,
        titles: true,
        score: true,
        role: true,
        banned: true,
        bannedReason: true,
        createdAt: true,
        _count: {
          select: {
            guides: true,
            diagnostics: true,
            deviceSessions: true,
          },
        },
      },
    }),
    getAllTitles(),
  ]);

  const users: UserRow[] = dbUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">User Management</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage user accounts, roles, mechanic titles, contribution scores, and session security.
        </p>
      </div>

      <UserTable users={users} availableTitles={availableTitles} currentAdminId={currentAdminId} />
    </div>
  );
}
