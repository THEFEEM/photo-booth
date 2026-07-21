import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

function validDate(d: string | null): string | null {
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

export async function GET(req: Request) {
  if (!(await requireStaff())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const date =
    validDate(url.searchParams.get("date")) ??
    (await pool.query<{ d: string }>(`select (now() at time zone 'Asia/Bangkok')::date::text as d`)).rows[0].d;

  const [totals, hourly, list] = await Promise.all([
    pool.query(
      `select
         count(*)::int as total,
         count(*) filter (where status = 'done')::int as done,
         count(*) filter (where status = 'no_show')::int as no_show,
         count(*) filter (where status = 'cancelled')::int as cancelled,
         count(*) filter (where status in ('waiting','called','shooting'))::int as active,
         count(*) filter (where status in ('pending_payment','pending_verify'))::int as pending,
         coalesce(sum(amount_thb) filter (where payment_status = 'paid'), 0) as revenue,
         coalesce(sum(amount_thb) filter (where payment_status = 'paid' and payment_method = 'promptpay'), 0) as revenue_promptpay,
         coalesce(sum(amount_thb) filter (where payment_status = 'paid' and payment_method = 'cash'), 0) as revenue_cash,
         coalesce(sum(photo_count) filter (where status = 'done'), 0)::int as photos,
         coalesce(sum(party_size) filter (where status = 'done'), 0)::int as guests,
         avg(extract(epoch from (done_at - called_at)) / 60)
           filter (where status = 'done' and called_at is not null and done_at is not null) as avg_session_min
       from bookings where booking_date = $1`,
      [date]
    ),
    pool.query(
      `select extract(hour from created_at at time zone 'Asia/Bangkok')::int as h, count(*)::int as n
       from bookings where booking_date = $1 group by 1 order by 1`,
      [date]
    ),
    pool.query(
      `select queue_label, name, party_size, photo_count, amount_thb, payment_method, payment_status, status,
              to_char(created_at at time zone 'Asia/Bangkok', 'HH24:MI') as created_time
       from bookings where booking_date = $1
       order by created_at desc limit 50`,
      [date]
    ),
  ]);

  const t = totals.rows[0];
  return NextResponse.json({
    date,
    totals: {
      total: t.total,
      done: t.done,
      noShow: t.no_show,
      cancelled: t.cancelled,
      active: t.active,
      pending: t.pending,
      revenue: Number(t.revenue),
      revenuePromptpay: Number(t.revenue_promptpay),
      revenueCash: Number(t.revenue_cash),
      photos: t.photos,
      guests: t.guests,
      avgSessionMin: t.avg_session_min != null ? Math.round(Number(t.avg_session_min) * 10) / 10 : null,
    },
    hourly: hourly.rows,
    bookings: list.rows.map((r) => ({
      queueLabel: r.queue_label,
      name: r.name,
      partySize: r.party_size,
      photoCount: r.photo_count,
      amountThb: Number(r.amount_thb),
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      status: r.status,
      createdTime: r.created_time,
    })),
  });
}
