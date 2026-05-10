import { findDocuments } from "@/lib/cloudant";
import { coerceEntry } from "@/lib/entryCoercion";
import { getFallbackDictionaryEntries } from "@/lib/fallbackDictionaryEntries";
import type { Entry } from "@/lib/types";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Mango selector: match `language_code` case-insensitively (e.g. `cy` vs `CY`). */
export function mangoLanguageCodeMatch(languageCode: string): Record<string, unknown> {
  const code = languageCode.trim().toLowerCase();
  // Cloudant rejects `{ $regex, $options }`; use inline `(?i)` like other selectors in this repo.
  return { language_code: { $regex: `(?i)^${escapeRegex(code)}$` } };
}

function normKey(w: string): string {
  return w.normalize("NFC").toLowerCase();
}

export async function loadDictionaryEntriesForLanguage(
  languageCode: string,
  limit = 2500
): Promise<Entry[]> {
  const code = languageCode.trim().toLowerCase();
  if (!code) return [];

  const baseAnd: Record<string, unknown>[] = [
    { type: "entry" },
    mangoLanguageCodeMatch(code),
    { $or: [{ status: { $exists: false } }, { status: "active" }, { status: "under_review" }] },
  ];
  const selector: Record<string, unknown> = { $and: baseAnd };

  let docs: Record<string, unknown>[] = [];
  try {
    docs = (await findDocuments("entries", selector, limit, 0)) as Record<string, unknown>[];
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("401") || message.includes("Missing Cloudant credentials")) {
      return getFallbackDictionaryEntries(code);
    }
    throw err;
  }

  const fromDb = docs.map(coerceEntry).filter((e) => e.status !== "removed");
  if (fromDb.length > 0) return fromDb;

  const fallback = getFallbackDictionaryEntries(code);
  return fallback.length > 0 ? fallback : [];
}

/**
 * Word-level English gloss: each dictionary `word` token is replaced by its `translation`.
 * Multi-word headwords (spaces) are substituted first (longest first). Hyphens stay inside one token.
 * Unknown tokens are left unchanged.
 */
export function glossTextWithDictionary(original: string, entries: Entry[]): string {
  const phraseEntries = entries
    .map((e) => {
      const w = e.word?.trim();
      if (!w || !/\s/.test(w)) return null;
      const t = e.translation?.trim();
      return { w, t: t || w };
    })
    .filter((x): x is { w: string; t: string } => Boolean(x));

  phraseEntries.sort((a, b) => b.w.length - a.w.length);

  let text = original;
  for (const { w, t } of phraseEntries) {
    const re = new RegExp(escapeRegex(w), "giu");
    text = text.replace(re, t);
  }

  const map = new Map<string, string>();
  for (const e of entries) {
    const w = e.word?.trim();
    if (!w || /\s/.test(w)) continue;
    const key = normKey(w);
    if (!map.has(key)) {
      const t = e.translation?.trim();
      map.set(key, t || w);
    }
  }

  return text.replace(/\p{L}[\p{L}\p{N}'’\-]*/gu, (token) => {
    const hit = map.get(normKey(token));
    return hit ?? token;
  });
}

export async function glossaryTranslationForLanguage(
  languageCode: string,
  sourceText: string
): Promise<string> {
  const entries = await loadDictionaryEntriesForLanguage(languageCode);
  return glossTextWithDictionary(sourceText, entries);
}
