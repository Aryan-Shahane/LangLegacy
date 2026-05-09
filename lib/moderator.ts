export function moderatorIdsFromEnv(): string[] {
  return (process.env.MODERATOR_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isEnvModerator(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return moderatorIdsFromEnv().includes(userId);
}
