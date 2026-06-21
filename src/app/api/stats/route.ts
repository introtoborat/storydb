import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, success } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";

// GET /api/stats
export async function GET() {
  try {
    const user = await requirePermission("stats.read");
    if (!user) return unauthorized();

    const [
      totalStories,
      totalPages,
      storiesByAgeGroup,
      storiesByGenre,
      storiesByGender,
      recentStories,
      avgPagesPerStory,
      tagsCount,
    ] = await Promise.all([
      prisma.story.count(),
      prisma.storyPage.count(),
      prisma.story.groupBy({ by: ["ageGroup"], _count: true }),
      prisma.story.groupBy({ by: ["genre"], _count: true }),
      prisma.story.groupBy({ by: ["characterGender"], _count: true }),
      prisma.story.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { tags: { include: { tag: true } } },
      }),
      prisma.story.aggregate({ _avg: { pageCount: true }, _sum: { pageCount: true } }),
      prisma.tag.count(),
    ]);

    return success({
      totalStories,
      totalPages,
      avgPagesPerStory: Math.round((avgPagesPerStory._avg.pageCount || 0) * 10) / 10,
      totalWords: avgPagesPerStory._sum.pageCount || 0,
      storiesByAgeGroup: storiesByAgeGroup.map((g) => ({ name: g.ageGroup, count: g._count })),
      storiesByGenre: storiesByGenre.map((g) => ({ name: g.genre, count: g._count })),
      storiesByGender: storiesByGender.map((g) => ({ name: g.characterGender, count: g._count })),
      recentStories: recentStories.map((s) => ({
        ...s,
        tagList: s.tags.map((t) => t.tag),
        tags: undefined,
      })),
      tagsCount,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
