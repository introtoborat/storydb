import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "crypto";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");

export type Role = "admin" | "editor" | "viewer";
export const ROLES: Role[] = ["admin", "editor", "viewer"];

export const PERMISSIONS = {
  // user management
  "user.create": ["admin"],
  "user.read": ["admin"],
  "user.update": ["admin"],
  "user.delete": ["admin"],
  "user.assignRole": ["admin"],
  "user.activate": ["admin"],
  "user.deactivate": ["admin"],
  "user.resetPassword": ["admin"],
  "user.viewActivityLog": ["admin"],
  // settings (lookup tables)
  "settings.manage": ["admin"],
  // stories
  "story.read": ["admin", "editor", "viewer"],
  "story.create": ["admin", "editor"],
  "story.update": ["admin", "editor"],
  "story.delete": ["admin"],
  // drafts
  "draft.manage": ["admin", "editor"],
  // export
  "export.run": ["admin", "editor"],
  // stats
  "stats.read": ["admin", "editor", "viewer"],
} as const satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string | undefined | null, perm: Permission): boolean {
  if (!role) return false;
  const allowed = (PERMISSIONS as Record<string, readonly string[]>)[perm];
  return !!allowed && allowed.includes(role);
}

// ===== Password helpers =====
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// ===== Token helpers =====
export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string };
  } catch {
    return null;
  }
}

// Single-use secure tokens for invitations and password resets.
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateSessionId(): string {
  return randomUUID();
}

// ===== Session helpers =====
export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Returns the current user (without password). Returns null for inactive users
// (treated as not authenticated). Pass `{ includeInactive: true }` for admin
// pages that need to inspect disabled accounts.
export async function getCurrentUser(opts: { includeInactive?: boolean } = {}) {
  const session = await getSession();
  if (!session) return null;

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  if (!opts.includeInactive && user.status !== "active") return null;
  return user;
}

// Strict auth: returns the user, or null if not authenticated or inactive.
export async function requireAuth() {
  return getCurrentUser();
}

// Returns the user if they have the given permission; null otherwise.
export async function requirePermission(perm: Permission) {
  const user = await requireAuth();
  if (!user) return null;
  return hasPermission(user.role, perm) ? user : null;
}

// Pull request metadata for audit logging.
export function getRequestMeta(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    undefined;
  const userAgent = request.headers.get("user-agent") || undefined;
  return { ip, userAgent };
}

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}