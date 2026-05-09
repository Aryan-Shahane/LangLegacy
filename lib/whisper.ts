export async function transcribeAudio(
  audioFile: File,
  languageCode?: string
): Promise<{ transcript: string; language_code: string }> {
  const serverUrl = process.env.WHISPER_SERVER_URL;
  if (!serverUrl) {
    throw new Error("Missing WHISPER_SERVER_URL");
  }

  const form = new FormData();
  form.append("audio", audioFile);
  if (languageCode) {
    form.append("language_code", languageCode);
  }

  const res = await fetch(`${serverUrl}/transcribe`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Whisper server error: ${res.status}`);
  }

  return (await res.json()) as { transcript: string; language_code: string };
}
