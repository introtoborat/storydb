import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { draftSaveSchema } from "@/lib/validations";
import { unauthorized, badRequest, success, forbidden } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";

// GET /api/drafts?storyId=xxx - Viewers can read drafts of stories they have
// access to (read permission covers drafts for visibility of in-progress work).
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission("draft.manage");
    if (!user) return forbidden();

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");

    const where: Record<string, unknown> = storyId ? { storyId } : {};
    const drafts = await prisma.draft.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: storyId ? 1 : 20,
    });

    return success(drafts);
  } catch (error) {
    console.error("Get drafts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/drafts - Save/update draft (editors + admins only).
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("draft.manage");
    if (!user) return forbidden();

    const body = await request.json();
    const parsed = draftSaveSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const existing = parsed.data.storyId
      ? await prisma.draft.findFirst({ where: { storyId: parsed.data.storyId } })
      : null;

    const draft = existing
      ? await prisma.draft.update({
          where: { id: existing.id },
          data: { data: parsed.data.data },
        })
      : await prisma.draft.create({
          data: { storyId: parsed.data.storyId, data: parsed.data.data },
        });

    return success(draft);
  } catch (error) {
    console.error("Save draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/drafts?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const user = await requirePermission("draft.manage");
    if (!user) return forbidden();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return badRequest("Draft id is required");

    await prisma.draft.delete({ where: { id } });
    return success({ message: "Draft deleted" });
  } catch (error) {
    console.error("Delete draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}