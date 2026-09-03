import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGuideBySlug } from "@/lib/queries";
import { updateGuide } from "@/app/guides/actions";
import { GuideEditorForm } from "@/components/guide-editor-form";

export default async function GuideEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  const session = await auth();
  const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;
  if (!user || (user.id !== guide.authorId && user.role !== "admin")) notFound();

  return <GuideEditorForm guide={guide} action={updateGuide.bind(null, guide.id)} />;
}
