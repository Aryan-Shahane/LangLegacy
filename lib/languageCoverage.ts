import { coerceEntry } from "@/lib/entryCoercion";
import { findDocuments, getDocument, putDocument } from "@/lib/cloudant";
import { entryHasMeaningfulTranslation } from "@/lib/entryTranslation";

export function entriesCoverageSelector(languageCode: string): Record<string, unknown> {
  return {
    $and: [
      { type: "entry" },
      { language_code: languageCode },
      { $or: [{ status: { $exists: false } }, { status: "active" }, { status: "under_review" }] },
    ],
  };
}

/** Recomputes translated counts and coverage on the language doc. Respects moderator_mode_lock when set. */
export async function recomputeLanguageCoverage(languageCode: string): Promise<void> {
  if (!languageCode) return;

  const rawDocs = (await findDocuments("entries", entriesCoverageSelector(languageCode), 8000, 0)) as Record<
    string,
    unknown
  >[];
  const entries = rawDocs.map(coerceEntry);
  const translatedCount = entries.filter(entryHasMeaningfulTranslation).length;
  const coverage = entries.length > 0 ? translatedCount / entries.length : 0;

  const lang = await getDocument("languages", languageCode);
  if (!lang || typeof lang !== "object" || typeof (lang as { _rev?: unknown })._rev !== "string") {
    return;
  }

  const existing = lang as Record<string, unknown>;
  const moderatorLock = existing.moderator_mode_lock === true;
  const prevMode = existing.mode === "full" ? "full" : "archive";
  const nextMode = moderatorLock ? prevMode : coverage >= 0.5 ? "full" : prevMode;

  await putDocument("languages", languageCode, {
    ...existing,
    entry_count: entries.length,
    translated_entry_count: translatedCount,
    translation_coverage: coverage,
    mode: nextMode,
    updated_at: new Date().toISOString(),
  });
}
