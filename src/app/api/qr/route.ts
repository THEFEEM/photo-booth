import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/** QR ชี้ไปหน้าจองของ origin ปัจจุบัน — ใช้กับหน้า /qr */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const origin = `${u.protocol}//${u.host}`;
  const qr = await QRCode.toDataURL(`${origin}/`, {
    margin: 1,
    width: 560,
    color: { dark: "#1c1917", light: "#FFFFFF" },
  });
  return NextResponse.json({ qr, url: origin });
}
