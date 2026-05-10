import { NextRequest, NextResponse } from "next/server";
import type { ExtractedEntry } from "@/lib/types";

/* ─── stop words ─── */

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "can", "could", "of", "in", "to", "for",
  "with", "on", "at", "from", "by", "as", "or", "and", "but", "if",
  "not", "no", "so", "up", "out", "that", "this", "it", "its", "my",
  "your", "his", "her", "we", "they", "them", "our",
  // Māori common particles
  "i", "e", "te", "ngā", "nga", "ki", "ko", "o", "a", "ka", "me",
  "he", "ai", "ia", "nei", "rā", "ra", "nō", "no", "kei", "hei",
  "mō", "mo", "tō", "to", "nā", "na", "ā", "tana", "ana", "ake",
  "tā", "ke",
  // Welsh common particles
  "y", "yr", "yn", "ar", "am", "ac", "ei", "eu",
  // General
  "ah", "oh", "um", "uh",
]);

/* ─── local word parser ─── */

function parseUniqueWords(transcript: string): string[] {
  const rawTokens = transcript
    .replace(/[.,!?;:()\[\]{}"'""''—–…]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const seen = new Map<string, string>();
  for (const tok of rawTokens) {
    const key = tok.toLowerCase();
    if (!seen.has(key)) seen.set(key, tok);
  }

  const words: string[] = [];
  for (const [key, original] of seen) {
    if (!STOP_WORDS.has(key) && key.length > 1) words.push(original);
  }
  return words;
}

/* ─── Featherless / Qwen translation ─── */

interface TranslationResult {
  word: string;
  translation: string;
  phonetic: string;
  cultural_gloss: string;
  part_of_speech: string;
}

async function translateWord(
  word: string,
  languageName: string,
  apiKey: string
): Promise<TranslationResult> {
  const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        {
          role: "user",
          content: `Translate the following word and return JSON only, no extra text:

Word: "${word}"
Language: ${languageName}

Return this exact format:
{
  "translation": "...",
  "phonetic": "...",
  "cultural_gloss": "...",
  "part_of_speech": "noun/verb/adjective/greeting/particle/phrase/other"
}

If you're not confident, put "UNCERTAIN" in the translation field.`,
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Featherless API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim() || "{}";

  // Extract JSON from response (handle markdown blocks)
  let jsonStr = content;
  const mdMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
  if (mdMatch) jsonStr = mdMatch[1];

  // Find the JSON object
  const objStart = jsonStr.indexOf("{");
  const objEnd = jsonStr.lastIndexOf("}");
  if (objStart >= 0 && objEnd > objStart) {
    jsonStr = jsonStr.slice(objStart, objEnd + 1);
  }

  const parsed = JSON.parse(jsonStr) as {
    translation?: string;
    phonetic?: string;
    cultural_gloss?: string;
    part_of_speech?: string;
  };

  return {
    word,
    translation: parsed.translation || word,
    phonetic: parsed.phonetic || "",
    cultural_gloss: parsed.cultural_gloss || "",
    part_of_speech: parsed.part_of_speech || "other",
  };
}

async function translateBatch(
  words: string[],
  languageName: string,
  apiKey: string
): Promise<TranslationResult[]> {
  // Batch all words into one prompt for efficiency
  const wordList = words.map((w, i) => `${i + 1}. "${w}"`).join("\n");

  const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        {
          role: "user",
          content: `Translate the following ${languageName} words to English. Return ONLY a JSON array, no extra text.

Words:
${wordList}

Return this exact format:
[
  {"word": "...", "translation": "...", "phonetic": "...", "cultural_gloss": "...", "part_of_speech": "noun/verb/adjective/greeting/particle/phrase/other"}
]

Rules:
- If you're not confident about a translation, put "UNCERTAIN" in the translation field.
- If the word has no direct English equivalent, explain briefly in translation.
- cultural_gloss should be a 1-2 sentence cultural or usage note.
- Return ALL ${words.length} words in the array.`,
        },
      ],
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Featherless batch API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim() || "[]";
  console.log("Qwen batch response (first 500 chars):", content.slice(0, 500));

  // Extract JSON array
  let jsonStr = content;
  const mdMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
  if (mdMatch) jsonStr = mdMatch[1];

  const arrStart = jsonStr.indexOf("[");
  const arrEnd = jsonStr.lastIndexOf("]");
  if (arrStart >= 0 && arrEnd > arrStart) {
    jsonStr = jsonStr.slice(arrStart, arrEnd + 1);
  }

  const parsed = JSON.parse(jsonStr) as TranslationResult[];
  return Array.isArray(parsed) ? parsed : [];
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

    const apiKey = process.env.HF_API_KEY;

    // Step 1: Parse unique words from transcript
    const uniqueWords = parseUniqueWords(transcript);
    console.log(`Parsed ${uniqueWords.length} unique words:`, uniqueWords);

    if (uniqueWords.length === 0) {
      return NextResponse.json({
        entries: [],
        warning: "No vocabulary words found in transcript.",
        source: "local_parser",
      });
    }

    // Step 2: Translate with Qwen via Featherless (always batch)
    let entries: ExtractedEntry[] = [];

    if (apiKey) {
      try {
        // Split into batches of 25 for efficiency
        const BATCH_SIZE = 25;
        const allResults: TranslationResult[] = [];

        for (let i = 0; i < uniqueWords.length; i += BATCH_SIZE) {
          const chunk = uniqueWords.slice(i, i + BATCH_SIZE);
          console.log(`  Translating batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} words)...`);
          try {
            const batchResults = await translateBatch(chunk, languageName, apiKey);
            allResults.push(...batchResults);
          } catch (err) {
            console.warn(`  Batch failed, skipping:`, err);
          }
          // Small delay between batches
          if (i + BATCH_SIZE < uniqueWords.length) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        console.log(`Qwen translated ${allResults.length} words total.`);

        // Filter out UNCERTAIN translations
        entries = allResults
          .filter((r) => !r.translation?.includes("UNCERTAIN"))
          .map((r) => ({
            word: r.word || "",
            translation: r.translation || r.word || "",
            definition: r.cultural_gloss || "",
            phonetic: r.phonetic || "",
            part_of_speech: r.part_of_speech || "other",
            example_sentence: transcript.length > 200 ? transcript.slice(0, 200) + "…" : transcript,
            example_translation: "",
          }));

        console.log(`After filtering UNCERTAIN: ${entries.length} entries remain.`);
      } catch (err) {
        console.warn("Qwen translation failed:", err);
      }
    } else {
      console.warn("HF_API_KEY not set, skipping Qwen translation.");
    }

    // Step 3: Fallback if Qwen failed
    if (entries.length === 0) {
      entries = uniqueWords.map((w) => ({
        word: w,
        translation: w,
        definition: `Extracted from ${languageName} transcript. Translation pending.`,
        phonetic: "",
        part_of_speech: "other",
        example_sentence: transcript.length > 200 ? transcript.slice(0, 200) + "…" : transcript,
        example_translation: "",
      }));
    }

    return NextResponse.json({
      entries,
      source: entries[0]?.definition?.includes("Translation pending") ? "local_parser" : "qwen",
    });
  } catch (error) {
    console.error("Extraction route error:", error);
    return NextResponse.json({
      entries: [],
      error: "Vocabulary extraction failed.",
      source: "error",
    });
  }
}
