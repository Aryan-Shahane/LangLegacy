import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const resolvedSalt = salt || randomBytes(16).toString("hex");
  const hash = scryptSync(password, resolvedSalt, KEY_LENGTH).toString("hex");
  return { hash, salt: resolvedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const next = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(hash, "hex");
  if (next.length !== stored.length) return false;
  return timingSafeEqual(next, stored);
}
