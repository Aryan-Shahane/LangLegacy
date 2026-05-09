/**
 * Languages that OpenAI Whisper can transcribe.
 * ISO 639-1 codes where available; a few use ISO 639-2/3.
 * Source: https://github.com/openai/whisper#available-models-and-languages
 */
const WHISPER_SUPPORTED_LANGUAGES = new Set([
  "af", // Afrikaans
  "ar", // Arabic
  "hy", // Armenian
  "az", // Azerbaijani
  "be", // Belarusian
  "bs", // Bosnian
  "bg", // Bulgarian
  "ca", // Catalan
  "zh", // Chinese
  "hr", // Croatian
  "cs", // Czech
  "da", // Danish
  "nl", // Dutch
  "en", // English
  "et", // Estonian
  "fi", // Finnish
  "fr", // French
  "gl", // Galician
  "de", // German
  "el", // Greek
  "he", // Hebrew
  "hi", // Hindi
  "hu", // Hungarian
  "is", // Icelandic
  "id", // Indonesian
  "it", // Italian
  "ja", // Japanese
  "kn", // Kannada
  "kk", // Kazakh
  "ko", // Korean
  "lv", // Latvian
  "lt", // Lithuanian
  "mk", // Macedonian
  "ms", // Malay
  "mr", // Marathi
  "mi", // Māori
  "ne", // Nepali
  "no", // Norwegian
  "fa", // Persian
  "pl", // Polish
  "pt", // Portuguese
  "ro", // Romanian
  "ru", // Russian
  "sr", // Serbian
  "sk", // Slovak
  "sl", // Slovenian
  "es", // Spanish
  "sw", // Swahili
  "sv", // Swedish
  "tl", // Tagalog
  "ta", // Tamil
  "th", // Thai
  "tr", // Turkish
  "uk", // Ukrainian
  "ur", // Urdu
  "vi", // Vietnamese
  "cy", // Welsh
]);

/**
 * Check whether Whisper can transcribe the given language code.
 */
export function isWhisperSupported(languageCode: string): boolean {
  return WHISPER_SUPPORTED_LANGUAGES.has(languageCode.toLowerCase());
}

export async function transcribeAudio(
  audioFile: File,
  languageCode?: string
): Promise<{ transcript: string; language_code: string }> {
  const serverUrl = process.env.WHISPER_SERVER_URL;
  if (!serverUrl) {
    return { 
      transcript: "(Mock transcript) User audio captured. Please supply your word or phrase.", 
      language_code: languageCode || "en" 
    };
  }

  const form = new FormData();
  form.append("audio", audioFile);
  if (languageCode) {
    form.append("language_code", languageCode);
  }

  let res: Response;
  try {
    res = await fetch(`${serverUrl}/transcribe`, {
      method: "POST",
      body: form,
    });
  } catch {
    return { 
      transcript: "(Mock transcript) User audio captured. Please supply your word or phrase.", 
      language_code: languageCode || "en" 
    };
  }

  if (!res.ok) {
    return { 
      transcript: "(Mock transcript) User audio captured. Please supply your word or phrase.", 
      language_code: languageCode || "en" 
    };
  }

  return (await res.json()) as { transcript: string; language_code: string };
}
