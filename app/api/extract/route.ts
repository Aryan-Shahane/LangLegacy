import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/watsonx";
import type { ExtractedEntry } from "@/lib/types";

/* ─── helpers ─── */

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  if (start < 0) throw new Error("No JSON object found in model output");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escaped) { escaped = false; }
      else if (ch === "\\") { escaped = true; }
      else if (ch === "\"") { inString = false; }
      continue;
    }
    if (ch === "\"") { inString = true; continue; }
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) return raw.slice(start, i + 1);
  }
  throw new Error("Incomplete JSON object in model output");
}

/**
 * Common filler / stop words that should NOT get their own panel.
 * Kept lowercase for comparison.
 */
const STOP_WORDS = new Set([
  // English fillers
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "can", "could", "of", "in", "to", "for",
  "with", "on", "at", "from", "by", "as", "or", "and", "but", "if",
  "not", "no", "so", "up", "out", "that", "this", "it", "its", "my",
  "your", "his", "her", "we", "they", "them", "our",
  // Māori common particles / prepositions (usually not vocabulary-worthy on their own)
  "i", "e", "te", "ngā", "nga", "ki", "ko", "o", "a", "ka", "me",
  "he", "ai", "ia", "nei", "rā", "ra", "nō", "no", "kei", "hei",
  "mō", "mo", "tō", "to", "nā", "na", "ā",
  // Welsh common particles
  "y", "yr", "yn", "ar", "am", "ac", "ei", "eu",
  // General
  "ah", "oh", "um", "uh",
]);

/**
 * Local transcript parser: splits the transcript into distinct words,
 * filters out stop-words and very short tokens, and builds one
 * ExtractedEntry panel per unique word.
 */
function parseTranscriptLocally(
  transcript: string,
  languageName: string
): ExtractedEntry[] {
  // Split on whitespace + basic punctuation
  const rawTokens = transcript
    .replace(/[.,!?;:()\[\]{}"'""''—–…]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // De-duplicate, preserving original casing for the first occurrence
  const seen = new Map<string, string>();
  for (const tok of rawTokens) {
    const key = tok.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, tok);
    }
  }

  const entries: ExtractedEntry[] = [];
  for (const [key, original] of seen) {
    // Skip stop words and very short tokens (single characters)
    if (STOP_WORDS.has(key) || key.length <= 1) continue;

    entries.push({
      word: original,
      translation: original, // keep as-is; user can fill in translation
      definition: `Extracted from ${languageName} transcript. Please provide a definition or cultural note.`,
      phonetic: "",
      part_of_speech: "other",
      example_sentence: transcript.length > 200 ? transcript.slice(0, 200) + "…" : transcript,
      example_translation: "",
    });
  }

  return entries;
}

/* ─── route ─── */

export async function POST(req: NextRequest) {
  try {
    const { transcript, language_name: languageName, language_code: languageCode } =
      (await req.json()) as {
        transcript?: string;
        language_name?: string;
        language_code?: string;
      };

    if (!transcript || !languageName || !languageCode) {
      return NextResponse.json({ error: "Missing transcript/language fields" }, { status: 400 });
    }

    /* ── 1. Try Watsonx AI extraction first ── */
    try {
      const prompt = `<|system|>
You are a computational linguist extracting vocabulary from an endangered language recording transcript.
Return ONLY valid JSON with no explanation and no markdown.
<|user|>
Language: ${languageName} (${languageCode})

Transcript:
${transcript}

Extract each word or phrase from the transcript that you think is good to know or important vocabulary in ${languageName}. For each return:
- word: the word as it appears
- translation: English translation (if there isn't a direct translation, leave it how it is or explain briefly)
- definition: short cultural or usage note (1-2 sentences)
- phonetic: IPA or simplified phonetic spelling when possible
- part_of_speech: noun / verb / adjective / greeting / particle / other
- example_sentence: a sentence from the transcript using this word
- example_translation: English translation of that sentence

Return exactly this JSON shape and nothing else:
{"entries":[{"word":"","translation":"","definition":"","phonetic":"","part_of_speech":"","example_sentence":"","example_translation":""}]}
<|assistant|>`;

      const raw = await generateText(prompt);

      let jsonString = raw;
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) jsonString = jsonMatch[1];

      const cleaned = jsonString.trim();
      const extracted = extractJsonObject(cleaned);
      const parsed = JSON.parse(extracted) as { entries?: ExtractedEntry[] };

      if (parsed.entries && parsed.entries.length > 0) {
        console.log(`Watsonx extracted ${parsed.entries.length} entries successfully.`);
        return NextResponse.json({
          entries: parsed.entries,
          source: "watsonx",
        });
      }
    } catch (err) {
      console.warn("Watsonx extraction failed, falling back to local parser:", err);
    }

    /* ── 2. Fallback: local transcript parser ── */
    console.log("Using local transcript parser for word extraction.");
    const localEntries = parseTranscriptLocally(transcript, languageName);

    return NextResponse.json({
      entries: localEntries,
      source: "local_parser",
    });
  } catch (error) {
    console.error("Extraction route error:", error);
    return NextResponse.json({
      entries: [],
      error: "Vocabulary extraction failed entirely.",
      source: "error",
    });
  }
}
