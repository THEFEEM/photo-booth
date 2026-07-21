import { NextResponse } from "next/server";
import { pool, withTx } from "@/lib/db";
import { calcAmountThb, MAX_PARTY, MIN_PARTY } from "@/lib/pricing";
import { issueQueueNumber } from "@/lib/queue";
import { notifyQueueUpdate } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: unknown; partySize?: unknown; photoCount?: unknown; paymentMethod?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 50) : "";
  const partySize = Number(body.partySize);
  const photoCount = Number(body.photoCount);
  const paymentMethod = body.paymentMethod;

  if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });
  if (!Number.isInteger(partySize) || partySize < MIN_PARTY || partySize > MAX_PARTY) {
    return NextResponse.json({ error: "จำนวนคนต้องอยู่ระหว่าง 1–10" }, { status: 400 });
  }
  if (paymentMethod !== "promptpay" && paymentMethod !== "cash") {
    return NextResponse.json({ error: "วิธีชำระเงินไม่ถูกต้อง" }, { status: 400 });
  }
  let amount: number;
  try {
    amount = calcAmountThb(photoCount);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  if (paymentMethod === "cash") {
    // เงินสด: ได้คิวทันที สถานะ unpaid — พนักงานเก็บเงิน/ยืนยันตอนเรียกคิว
    const out = await withTx(async (client) => {
      const ins = await client.query<{ id: string; token: string }>(
        `insert into bookings (name, party_size, photo_count, amount_thb, payment_method, payment_status, status)
         values ($1, $2, $3, $4, 'cash', 'unpaid', 'waiting')
         returning id, token`,
        [name, partySize, photoCount, amount]
      );
      const q = await issueQueueNumber(client, ins.rows[0].id);
      return { token: ins.rows[0].token, queueLabel: q.queueLabel };
    });
    await notifyQueueUpdate();
    return NextResponse.json({ token: out.token, queueLabel: out.queueLabel }, { status: 201 });
  }

  // PromptPay: ยังไม่ออกคิวจนกว่าสลิปผ่าน
  const ins = await pool.query<{ token: string }>(
    `insert into bookings (name, party_size, photo_count, amount_thb, payment_method, payment_status, status)
     values ($1, $2, $3, $4, 'promptpay', 'unpaid', 'pending_payment')
     returning token`,
    [name, partySize, photoCount, amount]
  );
  return NextResponse.json({ token: ins.rows[0].token }, { status: 201 });
}
