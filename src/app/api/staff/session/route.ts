import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ authed: await requireStaff() });
}
