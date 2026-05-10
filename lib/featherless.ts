const LANG_MAP: Record<string, string> = {
  mi: "Māori",
  cy: "Welsh",
  kw: "Cornish",
  gam: "Gamilaraay",
  oj: "Ojibwe",
};

function getLanguageName(code: string): string {
  return LANG_MAP[code] || code;
}

export async function translateTextWithAI(
  text: string,
  languageCode: string
): Promise<string> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error("Missing HF_API_KEY for Featherless AI.");
  }

  if (!text || !text.trim()) return "";

  const languageName = getLanguageName(languageCode);

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
          content: `Translate the following text from ${languageName} into English. Provide only the English translation and nothing else.

Text:
"${text}"`,
        },
      ],
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Featherless API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawContent = data.choices?.[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error("No content returned from AI translation");
  }

  // Remove any quotes if the model wrapped it in quotes
  return rawContent.replace(/^["']|["']$/g, "").trim();
}
