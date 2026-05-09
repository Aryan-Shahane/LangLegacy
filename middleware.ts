import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/mod")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session")?.value;
  const secret = process.env.AUTH_SECRET || "dev-auth-secret";
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = verified.payload.role;
    if (role !== "moderator" && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/mod/:path*"],
};
