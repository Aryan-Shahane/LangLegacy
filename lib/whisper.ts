export async function transcribeAudio(
  audioFile: File,
  languageCode?: string
): Promise<{ transcript: string; language_code: string }> {
  const serverUrl = process.env.WHISPER_SERVER_URL;
  if (!serverUrl) {
    throw new Error("Transcription server unavailable.");
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
    throw new Error("Transcription server unavailable.");
  }

  if (!res.ok) {
    throw new Error("Transcription server unavailable.");
  }

  return (await res.json()) as { transcript: string; language_code: string };
}
