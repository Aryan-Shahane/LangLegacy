"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";

type AuthMode = "login" | "signup";
type RoleMode = "user" | "moderator";

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = searchParams.get("next");
  const safeNext =
    nextHref && nextHref.startsWith("/") && !nextHref.startsWith("//") ? nextHref : "/";

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleMode>("user");
  const [moderatorCode, setModeratorCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        mode === "signup"
          ? { name, email, password, role, moderator_code: moderatorCode }
          : { email, password };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "Authentication failed");
        return;
      }
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("Could not reach authentication service");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl border border-[#E3DFD6] bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="font-serif text-3xl text-[#1B3022]">LangLegacy</Link>
          <h1 className="mt-4 font-serif text-2xl text-[#061B0E]">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-[#5A665F]">
            {mode === "signup"
              ? "Join our community to help preserve endangered languages."
              : "Sign in to continue your language preservation journey."}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-6 flex rounded-full bg-[#F5F3EE] p-1">
          <button
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${mode === "login" ? "bg-[#1B3022] text-white shadow-sm" : "text-[#434843] hover:text-[#1B3022]"}`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${mode === "signup" ? "bg-[#1B3022] text-white shadow-sm" : "text-[#434843] hover:text-[#1B3022]"}`}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {mode === "signup" ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-[#C3C8C1]/60 bg-[#FBF9F4] px-4 py-2.5 text-sm text-[#061B0E] placeholder:text-[#B3B8B4] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              className="w-full rounded-lg border border-[#C3C8C1]/60 bg-[#FBF9F4] px-4 py-2.5 text-sm text-[#061B0E] placeholder:text-[#B3B8B4] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              className="w-full rounded-lg border border-[#C3C8C1]/60 bg-[#FBF9F4] px-4 py-2.5 text-sm text-[#061B0E] placeholder:text-[#B3B8B4] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
            />
          </div>

          {mode === "signup" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`rounded-xl border-2 p-4 text-left transition ${role === "user" ? "border-[#1B3022] bg-[#E5F0E8]" : "border-[#E3DFD6] bg-white hover:border-[#C3C8C1]"}`}
                  >
                    <p className="text-sm font-bold text-[#061B0E]">Contributor</p>
                    <p className="mt-1 text-xs text-[#5A665F]">Record audio, add words, and help preserve languages.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("moderator")}
                    className={`rounded-xl border-2 p-4 text-left transition ${role === "moderator" ? "border-[#B24A2D] bg-[#FCE8E3]" : "border-[#E3DFD6] bg-white hover:border-[#C3C8C1]"}`}
                  >
                    <p className="text-sm font-bold text-[#061B0E]">Moderator</p>
                    <p className="mt-1 text-xs text-[#5A665F]">Review content, manage entries, and guide the community.</p>
                  </button>
                </div>
              </div>
              {role === "moderator" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5A665F]">
                    Moderator Invite Code
                  </label>
                  <input
                    value={moderatorCode}
                    onChange={(e) => setModeratorCode(e.target.value)}
                    placeholder="Enter your invite code"
                    className="w-full rounded-lg border border-[#C3C8C1]/60 bg-[#FBF9F4] px-4 py-2.5 text-sm text-[#061B0E] placeholder:text-[#B3B8B4] focus:border-[#B24A2D] focus:outline-none focus:ring-1 focus:ring-[#B24A2D]"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Error */}
        {error ? (
          <p className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-900">{error}</p>
        ) : null}

        {/* Submit */}
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="mt-6 w-full rounded-full bg-[#B24A2D] py-3 text-sm font-bold text-white transition hover:bg-[#8A3620] disabled:opacity-60"
        >
          {busy ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
        </button>

        {/* Footer toggle */}
        <p className="mt-5 text-center text-sm text-[#5A665F]">
          {mode === "login" ? (
            <>Don&apos;t have an account?{" "}
              <button type="button" onClick={() => setMode("signup")} className="font-semibold text-[#B24A2D] hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-[#B24A2D] hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F4]">
      <TopBar activeTab="dictionary" />
      <div className="flex justify-center px-4 py-16">
        <Suspense
          fallback={
            <div className="mx-auto max-w-md rounded-2xl border border-[#E3DFD6] bg-white p-8 text-center text-sm text-[#5A665F]">
              Loading sign-in...
            </div>
          }
        >
          <AuthInner />
        </Suspense>
      </div>
    </div>
  );
}
