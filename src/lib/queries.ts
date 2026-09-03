import { prisma } from "@/lib/prisma";
import { toLocalDateKey } from "@/lib/time";

const emptyGuideList = [] as const;
const emptyDiagnosticList = [] as const;
const emptyToolList = [] as const;

export const userProfileSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  image: true,
  avatarUrl: true,
  titles: true,
  bio: true,
  score: true,
  role: true,
  banned: true,
  bannedReason: true,
  bannedAt: true,
  createdAt: true,
} as const;

export async function getLatestGuides(viewerId?: string | null) {
  try {
    return await prisma.guide.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        author: true,
        _count: { select: { likes: true } },
        likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : { take: 1, select: { id: true } },
      },
    });
  } catch (error) {
    console.error("getLatestGuides failed", error);
    return emptyGuideList;
  }
}

export async function getGuideBySlug(slug: string, viewerId?: string | null) {
  try {
    return await prisma.guide.findUnique({
      where: { slug },
      include: {
        author: true,
        _count: { select: { likes: true } },
        likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : { take: 1, select: { id: true } },
      },
    });
  } catch (error) {
    console.error("getGuideBySlug failed", error);
    return null;
  }
}

export async function getLatestDiagnostics(viewerId?: string | null) {
  try {
    return await prisma.diagnostic.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
        likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : { take: 1, select: { id: true } },
        comments: {
          orderBy: { createdAt: "desc" },
          select: { id: true, content: true, createdAt: true },
        },
      },
    });
  } catch (error) {
    console.error("getLatestDiagnostics failed", error);
    return emptyDiagnosticList;
  }
}

export async function getDiagnosticBySlug(slug: string, viewerId?: string | null) {
  try {
    return await prisma.diagnostic.findUnique({
      where: { slug },
      include: {
        author: true,
        likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : { take: 1, select: { id: true } },
        _count: { select: { likes: true } },
comments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              content: true,
              createdAt: true,
              editedAt: true,
              parentId: true,
              author: {
                select: userProfileSelect,
              },
              likes: viewerId
                ? { where: { userId: viewerId }, select: { id: true } }
                : { take: 1, select: { id: true } },
              _count: { select: { likes: true } },
              replies: {
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  parentId: true,
                  editedAt: true,
                  author: {
                    select: userProfileSelect,
                  },
                  likes: viewerId
                    ? { where: { userId: viewerId }, select: { id: true } }
                    : { take: 1, select: { id: true } },
                  _count: { select: { likes: true } },
                },
              },
            },
          },
      },
    });
  } catch (error) {
    console.error("getDiagnosticBySlug failed", error);
    return null;
  }
}

export async function getTools() {
  try {
    return await prisma.tool.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { owner: true },
    });
  } catch (error) {
    console.error("getTools failed", error);
    return emptyToolList;
  }
}

export async function getUserByUsername(username: string) {
  try {
    return await prisma.user.findUnique({
      where: { username },
      select: {
        ...userProfileSelect,
        guides: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, slug: true, title: true, category: true, createdAt: true },
        },
        diagnostics: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, slug: true, title: true, createdAt: true, _count: { select: { comments: true } } },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            content: true,
            createdAt: true,
            diagnostic: { select: { id: true, slug: true, title: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error("getUserByUsername failed", error);
    return null;
  }
}

export interface ActivityDay {
  date: string;
  count: number;
}

/** Activity count per day for the last `days` days (commits-style). */
export async function getUserActivity(userId: string, days = 365): Promise<ActivityDay[]> {
  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const [guides, diagnostics, comments] = await Promise.all([
      prisma.guide.findMany({ where: { authorId: userId, createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.diagnostic.findMany({ where: { authorId: userId, createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.diagnosticComment.findMany({ where: { authorId: userId, createdAt: { gte: since } }, select: { createdAt: true } }),
    ]);

    const counts = new Map<string, number>();
    const allDates = [guides, diagnostics, comments];
    for (const list of allDates) {
      for (const item of list) {
        const key = toLocalDateKey(item.createdAt);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }

    const result: ActivityDay[] = [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const cursor = new Date(since);
    for (let d = 0; d < days; d++) {
      const key = toLocalDateKey(cursor);
      result.push({ date: key, count: counts.get(key) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  } catch (error) {
    console.error("getUserActivity failed", error);
    return [];
  }
}

export interface ProfileStats {
  totalGuides: number;
  totalDiagnostics: number;
  totalComments: number;
  totalLikes: number;
  guideLikes: number;
  diagnosticLikes: number;
  commentLikes: number;
  totalActivity: number;
}

export async function getOpenReports() {
  try {
    return await prisma.userReport.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: userProfileSelect },
        reported: { select: userProfileSelect },
      },
    });
  } catch (error) {
    console.error("getOpenReports failed", error);
    return [];
  }
}

export async function getResolvedReports() {
  try {
    return await prisma.userReport.findMany({
      where: { status: "resolved" },
      orderBy: { handledAt: "desc" },
      take: 20,
      include: {
        reporter: { select: userProfileSelect },
        reported: { select: userProfileSelect },
        handler: { select: { id: true, name: true, username: true } },
      },
    });
  } catch (error) {
    console.error("getResolvedReports failed", error);
    return [];
  }
}

export async function getUserStats(userId: string): Promise<ProfileStats> {
  try {
    const [guides, diagnostics, comments, guideLikes, diagnosticLikes, commentLikes] = await Promise.all([
      prisma.guide.count({ where: { authorId: userId } }),
      prisma.diagnostic.count({ where: { authorId: userId } }),
      prisma.diagnosticComment.count({ where: { authorId: userId } }),
      prisma.like.count({ where: { guide: { authorId: userId } } }),
      prisma.like.count({ where: { diagnostic: { authorId: userId } } }),
      prisma.like.count({ where: { comment: { authorId: userId } } }),
    ]);
    return {
      totalGuides: guides,
      totalDiagnostics: diagnostics,
      totalComments: comments,
      totalLikes: guideLikes + diagnosticLikes + commentLikes,
      guideLikes,
      diagnosticLikes,
      commentLikes,
      totalActivity: guides + diagnostics + comments,
    };
  } catch (error) {
    console.error("getUserStats failed", error);
    return {
      totalGuides: 0,
      totalDiagnostics: 0,
      totalComments: 0,
      totalLikes: 0,
      guideLikes: 0,
      diagnosticLikes: 0,
      commentLikes: 0,
      totalActivity: 0,
    };
  }
}