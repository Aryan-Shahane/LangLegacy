"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/types";

export default function LanguagePanel() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/languages", { cache: "no-store" });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Could not load languages.");
      return;
    }
    setError(null);
    setLanguages(((await res.json()) as Language[]).slice().sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- moderator dashboard initial fetch
    void load();
  }, [load]);

  const pct = useCallback((lang: Language) => {
    const c =
      typeof lang.translation_coverage === "number"
        ? lang.translation_coverage
        : lang.entry_count > 0 && typeof lang.translated_entry_count === "number"
          ? lang.translated_entry_count / lang.entry_count
          : 0;
    return Math.round(Math.max(0, Math.min(1, c)) * 100);
  }, []);

  const rows = useMemo(() => languages, [languages]);

  const patch = async (code: string, payload: Record<string, unknown>) => {
    setBusyCode(code);
    setError(null);
    try {
      const res = await fetch(`/api/languages/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Update failed (${res.status})`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusyCode(null);
    }
  };

  return (
    <section className="mt-12 space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">Languages · mode & coverage</h2>
          <p className="text-sm text-slate-400">
            Overrides lock mode against automatic coverage recomputation until you clear the lock below.
          </p>
        </div>
        <Button type="button" variant="outline" className="border-slate-600 text-slate-100" onClick={() => void load()}>
          Refresh
        </Button>
      </header>
      {error ? <p className="rounded border border-rose-900/70 bg-rose-950/50 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-slate-700 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="py-3 pr-4">Language</th>
              <th className="py-3 pr-4">Code</th>
              <th className="py-3 pr-4">Coverage</th>
              <th className="py-3 pr-4">Mode</th>
              <th className="py-3 pr-4">Lock</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lang) => {
              const locked = lang.moderator_mode_lock === true;
              const b = busyCode === lang.code;
              return (
                <tr key={lang.code} className="border-b border-slate-800 align-top">
                  <td className="py-3 pr-4 font-medium text-white">{lang.name}</td>
                  <td className="py-3 pr-4 font-mono text-slate-300">{lang.code}</td>
                  <td className="py-3 pr-4">{pct(lang)}%</td>
                  <td className="py-3 pr-4 capitalize">{lang.mode ?? "archive"}</td>
                  <td className="py-3 pr-4">{locked ? "Override" : "Auto"}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={b}
                        className="bg-slate-700 text-xs text-white hover:bg-slate-600"
                        onClick={() => void patch(lang.code, { mode: "archive" })}
                      >
                        Archive
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={b}
                        className="bg-emerald-800 text-xs hover:bg-emerald-700"
                        onClick={() => void patch(lang.code, { mode: "full" })}
                      >
                        Full
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={b || !locked}
                        className="border-slate-600 text-xs text-slate-100"
                        onClick={() => void patch(lang.code, { moderator_mode_lock: false })}
                      >
                        Clear lock
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length ? <p className="py-4 text-sm text-slate-400">No languages loaded.</p> : null}
      </div>
    </section>
  );
}
