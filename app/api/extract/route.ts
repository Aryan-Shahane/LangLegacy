import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/watsonx";
import type { ExtractedEntry } from "@/lib/types";

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  if (start < 0) {
    throw new Error("No JSON object found in model output");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) {
      return raw.slice(start, i + 1);
    }
  }

  throw new Error("Incomplete JSON object in model output");
}

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

    const prompt = `<|system|>
You are a computational linguist extracting vocabulary from an endangered language recording transcript.
Return ONLY valid JSON with no explanation and no markdown.
<|user|>
Language: ${languageName} (${languageCode})

Transcript:
${transcript}

Extract every distinct word or phrase in ${languageName}. For each return:
- word: the word as it appears
- translation: English gloss
- definition: short cultural or usage note (1-2 sentences)
- phonetic: IPA or simplified phonetic spelling when possible
- part_of_speech: noun / verb / adjective / greeting / particle / other
- example_sentence: a sentence from the transcript using this word
- example_translation: English translation of that sentence

Return exactly this JSON shape and nothing else:
{"entries":[{"word":"","translation":"","definition":"","phonetic":"","part_of_speech":"","example_sentence":"","example_translation":""}]}
<|assistant|>`;

    const raw = await generateText(prompt);
    const clean = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(extractJsonObject(clean)) as { entries?: ExtractedEntry[] };
    return NextResponse.json({ entries: parsed.entries || [] });
  } catch {
    return NextResponse.json({ error: "Vocabulary extraction failed." }, { status: 500 });
  }
}
