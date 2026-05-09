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
    <section className="space-y-4 rounded-3xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-[#434843]">
          Overrides lock mode until you <span className="font-medium text-[#061B0E]">Clear lock</span>, then automatic coverage rules apply again.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Refresh list
        </Button>
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-[#C3C8C1]/30 bg-[#FBF9F4]">
        <table className="min-w-full text-left text-sm text-[#1B1C19]">
          <thead className="border-b border-[#C3C8C1]/35 bg-[#F5F3EE] text-[11px] uppercase tracking-[0.12em] text-[#757C76]">
            <tr>
              <th className="px-4 py-3 pr-4">Language</th>
              <th className="py-3 pr-4">Code</th>
              <th className="py-3 pr-4">Coverage</th>
              <th className="py-3 pr-4">Mode</th>
              <th className="py-3 pr-4">Lock</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lang) => {
              const locked = lang.moderator_mode_lock === true;
              const b = busyCode === lang.code;
              return (
                <tr key={lang.code} className="border-b border-[#E8EDE9] align-top last:border-0">
                  <td className="px-4 py-3 pr-4 font-medium text-[#061B0E]">{lang.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-[#434843]">{lang.code}</td>
                  <td className="py-3 pr-4 tabular-nums">{pct(lang)}%</td>
                  <td className="py-3 pr-4 capitalize text-[#434843]">{lang.mode ?? "archive"}</td>
                  <td className="py-3 pr-4 text-[#434843]">{locked ? "Override" : "Auto"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={b}
                        className="border-[#8C7851]/35 text-xs"
                        onClick={() => void patch(lang.code, { mode: "archive" })}
                      >
                        Archive
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="pill"
                        disabled={b}
                        className="text-xs"
                        onClick={() => void patch(lang.code, { mode: "full" })}
                      >
                        Full
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={b || !locked}
                        className="text-xs text-[#9F4026]"
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
        {!rows.length ? <p className="p-6 text-center text-sm text-[#757C76]">No languages loaded.</p> : null}
      </div>
    </section>
  );
}
