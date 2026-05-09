"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    <section className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h1 className="text-xl font-semibold text-slate-100">{mode === "signup" ? "Create account" : "Log in"}</h1>
      <p className="text-sm text-slate-400">
        {mode === "signup"
          ? "Sign up to save contributions with your LangLegacy contributor profile."
          : "Log in to continue preserving dictionary entries."}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm ${mode === "login" ? "bg-cyan-700 text-white" : "border border-slate-700"}`}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm ${mode === "signup" ? "bg-cyan-700 text-white" : "border border-slate-700"}`}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>

      {mode === "signup" ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
      ) : null}

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
      />

      {mode === "signup" ? (
        <div className="space-y-2">
          <label className="block text-sm text-slate-300">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleMode)}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
          </select>
          {role === "moderator" ? (
            <input
              value={moderatorCode}
              onChange={(e) => setModeratorCode(e.target.value)}
              placeholder="Moderator signup code"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="w-full rounded bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-60"
      >
        {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </section>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <TopBar activeTab="dictionary" />
      <div className="flex justify-center px-4 py-10">
        <Suspense
          fallback={
            <section className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
              Loading sign-in...
            </section>
          }
        >
          <AuthInner />
        </Suspense>
      </div>
    </div>
  );
}
