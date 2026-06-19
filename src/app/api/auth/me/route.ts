import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET /api/auth/me - Returns the currently authenticated user (without password).
export async function GET() {
  try {
    const user = await getCurrentUser({ includeInactive: true });
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password,
      lastLoginAt: user.lastLoginAt,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/auth/logout - Clears the auth cookie and writes a logout audit row.
export async function POST(request: Request) {
  const session = await getSession();
  if (session) {
    await logAudit({
      actorId: session.userId,
      action: "logout",
      request,
    });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}