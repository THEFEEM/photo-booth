import { NextResponse } from "next/server";
import { getPublicQueue } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getPublicQueue());
}
