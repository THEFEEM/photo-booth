import { NextResponse } from "next/server";
import { checkPin, makeSessionToken, STAFF_COOKIE, STAFF_SESSION_HOURS } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!checkPin((body as { pin?: unknown }).pin)) {
    return NextResponse.json({ error: "PIN ไม่ถูกต้อง" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE, makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STAFF_SESSION_HOURS * 3600,
  });
  return res;
}
