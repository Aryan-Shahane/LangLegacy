import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDocument } from "@/lib/cloudant";
import type { User, UserRole } from "@/lib/types";

export type SessionIdentity = {
  userId: string;
  name: string;
  role: UserRole;
};

const FALLBACK_USER: SessionIdentity = {
  userId: "anon",
  name: "Anonymous",
  role: "user",
};

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export function getViewerIdentityFromHeaders(headers: Headers): SessionIdentity {
  const raw = headers.get("x-ll-user");
  if (!raw) return FALLBACK_USER;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionIdentity>;
    if (!parsed.userId || !parsed.name) return FALLBACK_USER;
    const role: UserRole =
      parsed.role === "admin" || parsed.role === "moderator" ? parsed.role : "user";
    return { userId: parsed.userId, name: parsed.name, role };
  } catch {
    return FALLBACK_USER;
  }
}

export async function getSessionFromCookie(): Promise<SessionIdentity | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET || "dev-auth-secret";
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    const payload = verified.payload as Record<string, unknown>;
    const userId = typeof payload.user_id === "string" ? payload.user_id : "";
    const name = typeof payload.name === "string" ? payload.name : "User";
    if (!userId) return null;

    const userDoc = (await getDocument("users", userId)) as User | null;
    const role: UserRole =
      userDoc?.role === "admin" || userDoc?.role === "moderator" ? userDoc.role : "user";
    return { userId, name, role };
  } catch {
    return null;
  }
}

export async function requireModeratorOrAdmin(): Promise<SessionIdentity> {
  const viewer = await getSessionFromCookie();
  if (!viewer || (viewer.role !== "moderator" && viewer.role !== "admin")) {
    throw new Error("Forbidden");
  }
  return viewer;
}

export async function requireSession(): Promise<SessionIdentity> {
  const viewer = await getSessionFromCookie();
  if (!viewer) {
    throw new Error("Unauthorized");
  }
  return viewer;
}

export async function createSessionToken(identity: SessionIdentity): Promise<string> {
  const secret = process.env.AUTH_SECRET || "dev-auth-secret";
  return new SignJWT({
    user_id: identity.userId,
    name: identity.name,
    role: identity.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
