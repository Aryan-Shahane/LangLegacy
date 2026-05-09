import type { Entry } from "@/lib/types";

export function coerceEntry(raw: Record<string, unknown>): Entry {
  const statusRaw = raw.status;
  let status: Entry["status"] = "active";
  if (statusRaw === "removed" || statusRaw === "under_review") {
    status = statusRaw;
  }

  const definition =
    typeof raw.definition === "string" && raw.definition.trim()
      ? raw.definition
      : mergeLegacyNotes(raw);

  let contributor_name =
    typeof raw.contributor_name === "string" && raw.contributor_name.trim()
      ? raw.contributor_name
      : null;
  if (!contributor_name && raw.source === "community") {
    contributor_name = "Community";
  }

  return {
    _id: String(raw._id),
    type: raw.type === "entry" ? "entry" : undefined,
    language_code: String(raw.language_code || ""),
    word: String(raw.word || ""),
    translation: String(raw.translation || ""),
    definition,
    audio_url: typeof raw.audio_url === "string" ? raw.audio_url : null,
    contributor_id: typeof raw.contributor_id === "string" ? raw.contributor_id : null,
    contributor_name,
    report_count: typeof raw.report_count === "number" ? raw.report_count : 0,
    status,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    phonetic: typeof raw.phonetic === "string" ? raw.phonetic : null,
    part_of_speech: typeof raw.part_of_speech === "string" ? raw.part_of_speech : null,
    example_sentence: typeof raw.example_sentence === "string" ? raw.example_sentence : null,
    example_translation:
      typeof raw.example_translation === "string" ? raw.example_translation : null,
    source: raw.source === "community" ? "community" : raw.source === "archive" ? "archive" : undefined,
  };
}

function mergeLegacyNotes(raw: Record<string, unknown>): string | null {
  const parts: string[] = [];
  if (typeof raw.phonetic === "string" && raw.phonetic.trim()) parts.push(raw.phonetic.trim());
  if (typeof raw.example_sentence === "string" && raw.example_sentence.trim()) {
    parts.push(raw.example_sentence.trim());
    if (
      typeof raw.example_translation === "string" &&
      raw.example_translation.trim()
    ) {
      parts[parts.length - 1] = `${parts[parts.length - 1]} (${raw.example_translation.trim()})`;
    }
  }
  return parts.length ? parts.join(" — ") : null;
}
