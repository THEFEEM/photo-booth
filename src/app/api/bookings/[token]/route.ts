import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { pool } from "@/lib/db";
import { promptPayPayload } from "@/lib/promptpay";
import { avgSessionMinutes } from "@/lib/queue";
import type { BookingStatusResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { rows } = await pool.query(
    `select id, booking_date, queue_no, queue_label, name, party_size, photo_count,
            amount_thb, payment_method, payment_status, status, slip_rejected_at, call_count
     from bookings where token = $1`,
    [token]
  );
  const b = rows[0];
  if (!b) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  let position: number | null = null;
  let etaMinutes: number | null = null;
  if (b.queue_no != null && (b.status === "waiting" || b.status === "called")) {
    const ahead = await pool.query<{ n: number }>(
      `select count(*)::int as n from bookings
       where booking_date = $1 and status in ('waiting','called','shooting') and queue_no < $2`,
      [b.booking_date, b.queue_no]
    );
    position = ahead.rows[0].n;
    etaMinutes = Math.round(position * (await avgSessionMinutes()));
  }

  let promptpayQr: string | null = null;
  if (b.status === "pending_payment" && b.payment_method === "promptpay" && process.env.PROMPTPAY_ID) {
    const payload = promptPayPayload(process.env.PROMPTPAY_ID, Number(b.amount_thb));
    promptpayQr = await QRCode.toDataURL(payload, { margin: 1, width: 360 });
  }

  const res: BookingStatusResponse = {
    status: b.status,
    paymentMethod: b.payment_method,
    paymentStatus: b.payment_status,
    name: b.name,
    partySize: b.party_size,
    photoCount: b.photo_count,
    amountThb: Number(b.amount_thb),
    queueLabel: b.queue_label,
    position,
    etaMinutes,
    promptpayQr,
    slipRejected: b.slip_rejected_at != null,
    callCount: b.call_count,
  };
  return NextResponse.json(res);
}
