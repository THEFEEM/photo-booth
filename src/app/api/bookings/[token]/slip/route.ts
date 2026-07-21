import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { notifyQueueUpdate } from "@/lib/realtime";
import { uploadSlip } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** ลูกค้าอัปโหลดสลิป → เก็บรูป → สถานะ pending_verify รอพนักงานตรวจ */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "กรุณาแนบรูปสลิป" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 10MB" }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะรูป JPG / PNG / WEBP" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `select id, payment_method, status from bookings where token = $1`,
    [token]
  );
  const b = rows[0];
  if (!b) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
  if (b.payment_method !== "promptpay" || b.status !== "pending_payment") {
    return NextResponse.json({ error: "การจองนี้ไม่ได้อยู่ในขั้นตอนรอชำระเงิน" }, { status: 409 });
  }

  const filename = file instanceof File && file.name ? file.name : "slip.jpg";
  const slipPath = await uploadSlip(b.id, file, filename);
  if (!slipPath) {
    return NextResponse.json(
      { error: "บันทึกรูปสลิปไม่สำเร็จ กรุณาลองใหม่ (ตรวจสอบ Storage bucket 'slips')" },
      { status: 500 }
    );
  }

  const upd = await pool.query(
    `update bookings
     set slip_path = $2, slip_uploaded_at = now(), slip_rejected_at = null, status = 'pending_verify'
     where id = $1 and status = 'pending_payment'`,
    [b.id, slipPath]
  );
  if (upd.rowCount !== 1) {
    return NextResponse.json({ error: "สถานะเปลี่ยนไปแล้ว กรุณารีเฟรช" }, { status: 409 });
  }

  await notifyQueueUpdate();
  return NextResponse.json({ status: "pending_verify" });
}
