import Link from "next/link";
import { getSessionFromCookie } from "@/lib/auth";

export default async function AppNav() {
  const viewer = await getSessionFromCookie();
  const isModerator = viewer?.role === "moderator" || viewer?.role === "admin";

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
      <Link href="/" className="text-xl font-semibold tracking-tight text-slate-100 hover:text-white">
        LangLegacy
      </Link>
      <nav className="flex items-center gap-6 text-sm" aria-label="Primary">
        <Link href="/" className="text-cyan-400/90 hover:text-cyan-300">
          Home
        </Link>
        <Link href="/mi?tab=dictionary" className="text-cyan-400/90 hover:text-cyan-300">
          Dictionary
        </Link>
        {isModerator ? (
          <Link href="/mod/reports" className="text-cyan-400/90 hover:text-cyan-300">
            Moderation
          </Link>
        ) : null}
        {viewer ? (
          <>
            <span className="text-slate-300">
              {viewer.name} · <span className="uppercase">{viewer.role}</span>
            </span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="text-slate-300 hover:text-white">
                Logout
              </button>
            </form>
          </>
        ) : (
          <Link href="/auth" className="text-cyan-400/90 hover:text-cyan-300">
            Login / Sign up
          </Link>
        )}
      </nav>
    </header>
  );
}
