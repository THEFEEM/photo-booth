import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const STAFF_COOKIE = "staff_session";
export const STAFF_SESSION_HOURS = 12;

function secret(): string {
  return process.env.STAFF_SESSION_SECRET ?? "dev-secret-change-me";
}

export function makeSessionToken(): string {
  const payload = String(Date.now() + STAFF_SESSION_HOURS * 3600_000);
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expect = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false;
  } catch {
    return false;
  }
  return Number(payload) > Date.now();
}

export function checkPin(pin: unknown): boolean {
  const expected = process.env.STAFF_PIN;
  if (!expected || typeof pin !== "string") return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireStaff(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(STAFF_COOKIE)?.value);
}
