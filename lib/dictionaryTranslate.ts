import { findDocuments } from "@/lib/cloudant";
import { coerceEntry } from "@/lib/entryCoercion";
import type { Entry } from "@/lib/types";

export async function loadDictionaryEntriesForLanguage(
  languageCode: string,
  limit = 2500
): Promise<Entry[]> {
  const baseAnd: Record<string, unknown>[] = [
    { type: "entry" },
    { language_code: languageCode },
    { $or: [{ status: { $exists: false } }, { status: "active" }, { status: "under_review" }] },
  ];
  const selector: Record<string, unknown> = { $and: baseAnd };
  const docs = (await findDocuments("entries", selector, limit, 0)) as Record<string, unknown>[];
  return docs.map(coerceEntry).filter((e) => e.status !== "removed");
}

function normKey(w: string): string {
  return w.normalize("NFC").toLowerCase();
}

/**
 * Word-level English gloss: each dictionary `word` token is replaced by its `translation`.
 * Unknown tokens are left unchanged. Uses Unicode letters (works for many scripts; best with space-delimited text).
 */
export function glossTextWithDictionary(original: string, entries: Entry[]): string {
  const map = new Map<string, string>();
  for (const e of entries) {
    const w = e.word?.trim();
    if (!w) continue;
    const key = normKey(w);
    if (!map.has(key)) {
      const t = e.translation?.trim();
      map.set(key, t || w);
    }
  }

  return original.replace(/\p{L}[\p{L}\p{N}'’]*/gu, (token) => {
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
