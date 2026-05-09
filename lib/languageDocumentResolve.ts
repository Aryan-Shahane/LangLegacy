import {
  findDocuments,
  getAllDocuments,
  getDocument,
  saveDocument,
} from "@/lib/cloudant";
import { ARCHIVE_DEMO_LANGUAGE } from "@/lib/archiveDemoLanguage";

export function normalizeWritableLanguage(
  raw: unknown
): { doc: Record<string, unknown>; couchId: string } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r._id === "string" ? r._id.trim() : "";
  if (!id) return null;
  const revVal = r._rev;
  const _rev =
    typeof revVal === "string"
      ? revVal
      : typeof revVal === "number"
        ? String(revVal)
        : null;
  if (!_rev) return null;
  return {
    couchId: id,
    doc: { ...r, _rev },
  };
}

export function rowMatchesLookup(doc: Record<string, unknown>, keyLc: string): boolean {
  const id = typeof doc._id === "string" ? doc._id.trim().toLowerCase() : "";
  if (id === keyLc) return true;
  const codeFields = ["code", "language_code", "languageCode", "lang", "slug"] as const;
  for (const f of codeFields) {
    const v = doc[f];
    if (typeof v === "string" && v.trim().toLowerCase() === keyLc) return true;
  }
  return false;
}

/** `_all_docs` rows can omit revisions; hydrate with GET by `_id`. */
export async function writableLanguageFromScanRow(
  row: Record<string, unknown>
): Promise<{ doc: Record<string, unknown>; couchId: string } | null> {
  const fromRow = normalizeWritableLanguage(row);
  if (fromRow) return fromRow;
  const id = typeof row._id === "string" ? row._id.trim() : "";
  if (!id || row._deleted === true) return null;
  return normalizeWritableLanguage(await getDocument("languages", id));
}

export async function pickFromLanguagesList(rows: Record<string, unknown>[], lookupKey: string) {
  const key = lookupKey.trim().toLowerCase();
  if (!key) return null;

  const matched = rows.filter((row) => rowMatchesLookup(row, key));

  const iter = matched.length > 0 ? matched : rows;
  for (const row of iter) {
    if (matched.length === 0 && !rowMatchesLookup(row, key)) continue;
    const resolved = await writableLanguageFromScanRow(row);
    if (!resolved || !rowMatchesLookup(resolved.doc, key)) continue;
    return resolved;
  }
  return null;
}

async function mangoFind(sel: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  try {
    const rows = await findDocuments("languages", sel, 8, 0);
    return rows.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
  } catch {
    return [];
  }
}

/** Resolve Couch language doc before moderator PATCH/PUT semantics. */
export async function resolveEditableLanguage(
  rawId: string
): Promise<{ doc: Record<string, unknown>; couchId: string } | null> {
  const lookupKey = decodeURIComponent(rawId).trim();
  if (!lookupKey) return null;

  const direct = normalizeWritableLanguage(await getDocument("languages", lookupKey));
  if (direct) return direct;

  const keyLc = lookupKey.toLowerCase();
  const mangoRows = [...(await mangoFind({ code: lookupKey })), ...(await mangoFind({ language_code: lookupKey }))];

  const seenIds = new Set<string>();
  for (const row of mangoRows) {
    const cid = typeof row._id === "string" ? row._id : "";
    if (!cid || seenIds.has(cid)) continue;
    seenIds.add(cid);
    const n = normalizeWritableLanguage(row);
    if (n && rowMatchesLookup(n.doc, keyLc)) return n;
    const fetched = normalizeWritableLanguage(await getDocument("languages", cid));
    if (fetched && rowMatchesLookup(fetched.doc, keyLc)) return fetched;
  }

  const all = ((await getAllDocuments("languages")) as Record<string, unknown>[]).filter(
    (d): d is Record<string, unknown> => typeof d === "object" && d !== null
  );

  const scanned = await pickFromLanguagesList(all, lookupKey);
  if (scanned) return scanned;

  if (keyLc === ARCHIVE_DEMO_LANGUAGE.code) {
    const d = ARCHIVE_DEMO_LANGUAGE;
    await saveDocument("languages", {
      _id: d.code,
      type: "language",
      name: d.name,
      code: d.code,
      region: d.region,
      description: d.description ?? null,
      native_script: d.native_script ?? null,
      speaker_count: d.speaker_count ?? null,
      entry_count: d.entry_count,
      translated_entry_count: d.translated_entry_count ?? 0,
      translation_coverage: d.translation_coverage ?? 0,
      mode: d.mode ?? "archive",
      moderator_mode_lock: false,
      contributor_count: d.contributor_count ?? 0,
      created_at: d.created_at,
      updated_at: new Date().toISOString(),
    });
    const created = normalizeWritableLanguage(await getDocument("languages", d.code));
    if (created) return created;
  }

  return null;
}
