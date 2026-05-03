import { generateId } from "./utils";

const KEY_PREFIX = "ask_";

export async function generateApiKey(): Promise<{ key: string; prefix: string; hash: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const key = `${KEY_PREFIX}${secret}`;
  const prefix = key.slice(0, 12);
  const hash = await sha256(key);
  return { key, prefix, hash };
}

export async function hashApiKey(key: string): Promise<string> {
  return sha256(key);
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newApiKeyId(): string {
  return generateId("key");
}
