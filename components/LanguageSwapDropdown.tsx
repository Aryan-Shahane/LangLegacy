"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/utils";

const RESERVED_FIRST_SEGMENTS = new Set(["auth", "mod", "admin", "_next", "api"]);

/** Build destination path preserving sub-routes like `/mi/contribute` and query strings. */
function targetPath(pathname: string, searchSuffix: string, newCode: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return `/${newCode}${searchSuffix}`;
  }
  const head = segments[0];
  if (RESERVED_FIRST_SEGMENTS.has(head)) {
    return `/${newCode}${searchSuffix}`;
  }
  segments[0] = newCode;
  return `/${segments.join("/")}${searchSuffix}`;
}

type Props = {
  /** Prefer server-provided code when nested under `[language]` routes. */
  currentCodeHint?: string;
};

export default function LanguageSwapDropdown({ currentCodeHint }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch("/api/languages", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Language[];
        if (mounted && Array.isArray(data)) {
          setLanguages([...data].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch {
        /* keep empty */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const derivedFromPath = useMemo(() => {
    if (!pathname || pathname === "/") return "";
    const seg = pathname.split("/").filter(Boolean)[0] || "";
    if (!seg || RESERVED_FIRST_SEGMENTS.has(seg)) return "";
    return seg;
  }, [pathname]);

  const currentCode = (currentCodeHint || derivedFromPath || "").trim().toLowerCase();

  const currentLabel =
    languages.find((l) => l.code.toLowerCase() === currentCode)?.name ||
    (currentCode ? currentCode.toUpperCase() : "Language");

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const navigate = (code: string) => {
    if (!pathname) return;
    const search =
      typeof window !== "undefined" && window.location.search ? window.location.search : "";
    const next = targetPath(pathname, search, code);
    setOpen(false);
    router.push(next);
    router.refresh();
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Swap language archive"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 min-w-[7.5rem] max-w-[10.5rem] items-center justify-between gap-2 rounded-full border border-[#C3C8C1]/25 bg-[#31493B] px-3 text-left text-sm text-[#D0E9D4] transition hover:bg-[#3a5848]"
      >
        <span className="truncate">{currentLabel}</span>
        <span className="shrink-0 text-[10px] opacity-75" aria-hidden>
          ▼
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-[60] mt-2 max-h-72 min-w-[12rem] overflow-y-auto rounded-lg border border-[#C3C8C1]/25 bg-[#22382B] py-1 shadow-xl ring-1 ring-black/15"
        >
          {!languages.length ? (
            <li className="px-3 py-2 text-xs text-[#C8BBAD]">Loading languages…</li>
          ) : (
            languages.map((lang) => {
              const active = lang.code.toLowerCase() === currentCode;
              return (
                <li key={lang.code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[#E8EDE9]",
                      active ? "bg-[#30483A] text-[#B4CDB8]" : "hover:bg-[#30483A]"
                    )}
                    onClick={() => navigate(lang.code)}
                  >
                    <span className="truncate font-medium">{lang.name}</span>
                    <span className="shrink-0 text-xs uppercase text-[#9AACA0]">{lang.code}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
