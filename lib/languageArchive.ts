import { getDocument } from "@/lib/cloudant";

/** English Community glosses stay off until Cloudant marks the language `mode: \"full\"`. */
export async function languageIsArchiveMode(languageCode: string): Promise<boolean> {
  const id = languageCode.trim().toLowerCase();
  if (!id) return true;
  const doc = await getDocument("languages", id);
  const mode = doc && typeof doc === "object" ? (doc as { mode?: unknown }).mode : undefined;
  return mode !== "full";
}
