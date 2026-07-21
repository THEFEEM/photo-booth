import { NextResponse } from "next/server";
import { pool, withTx } from "@/lib/db";
import { issueQueueNumber } from "@/lib/queue";
import { notifyQueueUpdate } from "@/lib/realtime";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

// state machine ฝั่งพนักงาน — extra เป็น literal SQL คงที่เท่านั้น (ห้าม interpolate user input)
const TRANSITIONS: Record<string, { from: string[]; to: string; extra: string[] }> = {
  call:        { from: ["waiting"],           to: "called",          extra: ["called_at = now()", "call_count = call_count + 1"] },
  recall:      { from: ["called"],            to: "called",          extra: ["call_count = call_count + 1"] },
  start:       { from: ["called", "waiting"], to: "shooting",        extra: ["shooting_at = now()"] },
  done:        { from: ["shooting"],          to: "done",            extra: ["done_at = now()"] },
  no_show:     { from: ["called"],            to: "no_show",         extra: [] },
  requeue:     { from: ["no_show"],           to: "waiting",         extra: [] },
  reject_slip: { from: ["pending_verify"],    to: "pending_payment", extra: ["slip_rejected_at = now()"] },
  cancel:      { from: ["pending_payment", "pending_verify", "waiting", "called"], to: "cancelled", extra: [] },
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = (body as { action?: string }).action ?? "";

  // อนุมัติสลิป: จ่ายแล้ว + ออกเลขคิว ใน tx เดียว
  if (action === "approve_slip") {
    const out = await withTx(async (client) => {
      const upd = await client.query(
        `update bookings set payment_status = 'paid', paid_at = now(), status = 'waiting'
         where id = $1 and status = 'pending_verify' returning id`,
        [id]
      );
      if (upd.rowCount !== 1) return null;
      return issueQueueNumber(client, id);
    });
    if (!out) {
      return NextResponse.json({ error: "อนุมัติไม่ได้ — สถานะเปลี่ยนไปแล้ว" }, { status: 409 });
    }
    await notifyQueueUpdate();
    return NextResponse.json({ ok: true, queueLabel: out.queueLabel });
  }

  if (action === "confirm_cash") {
    const upd = await pool.query(
      `update bookings set payment_status = 'paid', paid_at = now()
       where id = $1 and payment_method = 'cash' and payment_status = 'unpaid'
       returning id`,
      [id]
    );
    if (upd.rowCount !== 1) {
      return NextResponse.json({ error: "ยืนยันไม่ได้ — สถานะเปลี่ยนไปแล้ว" }, { status: 409 });
    }
    await notifyQueueUpdate();
    return NextResponse.json({ ok: true });
  }

  const t = TRANSITIONS[action];
  if (!t) return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });

  const sets = ["status = $2", ...t.extra].join(", ");
  const upd = await pool.query(
    `update bookings set ${sets} where id = $1 and status = any($3::text[]) returning id, status`,
    [id, t.to, t.from]
  );
  if (upd.rowCount !== 1) {
    return NextResponse.json({ error: "ทำรายการไม่ได้ — สถานะเปลี่ยนไปแล้ว รีเฟรชหน้าจอ" }, { status: 409 });
  }
  await notifyQueueUpdate();
  return NextResponse.json({ ok: true, status: upd.rows[0].status });
}
