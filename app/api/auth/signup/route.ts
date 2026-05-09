import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { findDocuments, saveDocument } from "@/lib/cloudant";
import { hashPassword } from "@/lib/password";
import type { User, UserRole } from "@/lib/types";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  moderator_code?: string;
};

type StoredUser = User & { password_hash: string; password_salt: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SignupBody;
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const requestedRole = body.role === "moderator" ? "moderator" : "user";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
    }

    let role: UserRole = requestedRole;
    if (requestedRole === "moderator") {
      const requiredCode = process.env.MODERATOR_SIGNUP_CODE;
      if (!requiredCode || body.moderator_code !== requiredCode) {
        return NextResponse.json({ error: "invalid moderator signup code" }, { status: 403 });
      }
      role = "moderator";
    }

    const existing = (await findDocuments("users", { type: "user", email }, 1, 0)) as StoredUser[];
    if (existing.length > 0) {
      return NextResponse.json({ error: "an account with that email already exists" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { hash, salt } = hashPassword(password);
    const user: StoredUser = {
      _id: randomUUID(),
      type: "user",
      name,
      email,
      role,
      created_at: now,
      password_hash: hash,
      password_salt: salt,
    };

    await saveDocument("users", user as unknown as Record<string, unknown>);
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
      { error: error instanceof Error ? error.message : "failed to sign up" },
      { status: 500 },
    );
  }
}
