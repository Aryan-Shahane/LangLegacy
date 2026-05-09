import type { Entry } from "@/lib/types";

/** True when English translation exists and is not the archived placeholder text. */
export function entryHasMeaningfulTranslation(e: Pick<Entry, "translation">): boolean {
  const t = (e.translation || "").trim();
  if (!t) return false;
  if (/^\(needs translation\)$/i.test(t)) return false;
  return true;
}
