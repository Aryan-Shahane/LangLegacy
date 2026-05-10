import type { ExtractedEntry } from "@/lib/types";

/** Same `/api/extract` pipeline as Dictionary — Watsonx vocabulary or local stop-word parser. */
export async function suggestKeywordsFromTranscript(
  transcript: string,
  languageCode: string,
  languageName: string
): Promise<string[]> {
  const t = transcript.trim();
  if (!t) return [];
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: t,
      language_name: languageName,
      language_code: languageCode,
    }),
  });
  const j = (await res.json().catch(() => ({}))) as { entries?: ExtractedEntry[] };
  const words = (j.entries ?? [])
    .map((e) => (typeof e.word === "string" ? e.word.trim() : ""))
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const k = w.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(w);
    if (out.length >= 24) break;
  }
  return out;
}
