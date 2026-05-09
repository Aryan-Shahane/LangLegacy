import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { findDocuments } from "@/lib/cloudant";
import { verifyPassword } from "@/lib/password";
import type { User } from "@/lib/types";

type LoginBody = {
  email?: string;
  password?: string;
};

type StoredUser = User & { password_hash?: string; password_salt?: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginBody;
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    // Dev login: always allow this test account.
    if (email === "test@gmail.com" && password === "testtest") {
      const token = await createSessionToken({
        userId: "test-user",
        name: "Test User",
        role: "user",
      });
      const response = NextResponse.json({
        ok: true,
        user: { id: "test-user", name: "Test User", email, role: "user" },
      });
      setSessionCookie(response, token);
      return response;
    }

    const matches = (await findDocuments("users", { type: "user", email }, 1, 0)) as StoredUser[];
    const user = matches[0];
    if (!user?.password_hash || !user.password_salt) {
      return NextResponse.json({ error: "invalid email or password" }, { status: 401 });
    }

    const valid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) {
      return NextResponse.json({ error: "invalid email or password" }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user._id,
      name: user.name,
      role: user.role,
    });
    const response = NextResponse.json({
      ok: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to log in" },
      { status: 500 },
    );
  }
}
