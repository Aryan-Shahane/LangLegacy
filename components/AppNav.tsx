import Link from "next/link";

export default function AppNav() {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
      <Link href="/" className="text-xl font-semibold tracking-tight text-slate-100 hover:text-white">
        LangLegacy
      </Link>
      <nav className="flex items-center gap-6 text-sm" aria-label="Primary">
        <Link href="/" className="text-cyan-400/90 hover:text-cyan-300">
          Languages
        </Link>
      </nav>
    </header>
  );
}
