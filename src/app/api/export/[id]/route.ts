import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound, forbidden } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";

// GET /api/export/[id]?format=pdf|docx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("export.run");
    if (!user) return forbidden();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf";

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        pages: { orderBy: { pageNumber: "asc" } },
      },
    });

    if (!story) return notFound("Story not found");

    if (format === "docx") {
      return exportDocx(story);
    }

    return exportPdf(story);
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function exportPdf(story: { title: string; ageGroup: string; genre: string; characterGender: string; pages: { pageNumber: number; storyText: string; sceneDescription: string | null; imagePrompt: string | null; notes: string | null }[] }) {
  // Dynamic import for PDF generation
  // For simplicity, we'll return a structured JSON that the client can use with jsPDF
  return NextResponse.json({
    story: {
      title: story.title,
      metadata: `Age Group: ${story.ageGroup} | Genre: ${story.genre} | Gender: ${story.characterGender}`,
      pages: story.pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.storyText,
        scene: p.sceneDescription,
      })),
    },
    format: "pdf",
  });
}

function exportDocx(story: { title: string; ageGroup: string; genre: string; characterGender: string; pages: { pageNumber: number; storyText: string; sceneDescription: string | null; imagePrompt: string | null; notes: string | null }[] }) {
  // Return structured JSON that the client can use with docx library
  return NextResponse.json({
    story: {
      title: story.title,
      metadata: `Age Group: ${story.ageGroup} | Genre: ${story.genre} | Gender: ${story.characterGender}`,
      pages: story.pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.storyText,
        scene: p.sceneDescription,
      })),
    },
    format: "docx",
  });
}
