import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireStaff } from "@/lib/staff-auth";
import { signSlipUrl } from "@/lib/storage";
import type { StaffBooking, StaffQueueResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

async function mapRow(r: Record<string, unknown>): Promise<StaffBooking> {
  const slipPath = r.slip_path as string | null;
  const needsSlip = r.status === "pending_verify" && slipPath;
  return {
    id: r.id as string,
    queueLabel: (r.queue_label as string) ?? null,
    name: r.name as string,
    partySize: r.party_size as number,
    photoCount: r.photo_count as number,
    amountThb: Number(r.amount_thb),
    paymentMethod: r.payment_method as StaffBooking["paymentMethod"],
    paymentStatus: r.payment_status as StaffBooking["paymentStatus"],
    status: r.status as StaffBooking["status"],
    callCount: r.call_count as number,
    createdAt: (r.created_at as Date).toISOString(),
    slipUrl: needsSlip ? await signSlipUrl(slipPath) : null,
  };
}

export async function GET() {
  if (!(await requireStaff())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cols = `id, queue_label, name, party_size, photo_count, amount_thb,
                payment_method, payment_status, status, call_count, created_at, slip_path`;

  const [active, recent, stats] = await Promise.all([
    pool.query(
      `select ${cols} from bookings
       where booking_date = (now() at time zone 'Asia/Bangkok')::date
         and status in ('pending_payment','pending_verify','waiting','called','shooting','no_show')
       order by case status
                  when 'shooting' then 0 when 'called' then 1 when 'pending_verify' then 2
                  when 'waiting' then 3 when 'no_show' then 4 else 5 end,
                queue_no asc nulls last, created_at asc`
    ),
    pool.query(
      `select ${cols} from bookings
       where booking_date = (now() at time zone 'Asia/Bangkok')::date
         and status in ('done','cancelled')
       order by coalesce(done_at, created_at) desc limit 10`
    ),
    pool.query<{ waiting: number; done_today: number; revenue: string | null }>(
      `select
         count(*) filter (where status = 'waiting')::int as waiting,
         count(*) filter (where status = 'done')::int as done_today,
         sum(amount_thb) filter (where payment_status = 'paid') as revenue
       from bookings
       where booking_date = (now() at time zone 'Asia/Bangkok')::date`
    ),
  ]);

  const res: StaffQueueResponse = {
    active: await Promise.all(active.rows.map(mapRow)),
    recent: await Promise.all(recent.rows.map(mapRow)),
    stats: {
      waiting: stats.rows[0].waiting,
      doneToday: stats.rows[0].done_today,
      revenuePaidThb: Number(stats.rows[0].revenue ?? 0),
    },
  };
  return NextResponse.json(res);
}
