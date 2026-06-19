import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestPasswordResetSchema } from "@/lib/validations";
import { generateToken, hoursFromNow } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// POST /api/password-resets - Public. User requests a password reset for
// their own account. Always returns success to avoid leaking which emails
// are registered; the reset URL is only included for development convenience.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestPasswordResetSchema.safeParse(body);
    if (!parsed.success) {
      // Still return success — don't leak account existence or schema details.
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

    if (user && user.status === "active") {
      const token = generateToken();
      const expiresAt = hoursFromNow(1);
      await prisma.passwordReset.create({
        data: { userId: user.id, token, triggeredBy: "self", expiresAt },
      });
      await logAudit({
        actorId: user.id,
        action: "password.reset_request",
        entity: "user",
        entityId: user.id,
        targetUserId: user.id,
        metadata: { triggeredBy: "self" },
        request,
      });
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/reset-password?token=${token}`;
      // In production this would only be sent via email. For local dev we
      // return it so the UI can show it. Toggle via env if needed.
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ success: true, resetUrl, expiresAt });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Request reset error:", error);
    return NextResponse.json({ success: true });
  }
}