import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminLayoutWrapper from "./admin-layout-wrapper";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  let openReportsCount = 0;
  try {
    openReportsCount = await prisma.userReport.count({
      where: { status: "open" },
    });
  } catch {
    openReportsCount = 0;
  }

  return (
    <div className="admin-shell">
      <AdminLayoutWrapper openReportsCount={openReportsCount}>
      {children}
      </AdminLayoutWrapper>
    </div>
  );
}
