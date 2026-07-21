import type { PoolClient } from "pg";
import { pool } from "./db";
import type { QueueState } from "./types";

export const QUEUE_PREFIX = "A";

/** ออกเลขคิวแบบ atomic (upsert counter ต่อวัน) — เรียกภายใน transaction เดียวกับการอัปเดต booking */
export async function issueQueueNumber(
  client: PoolClient,
  bookingId: string
): Promise<{ queueNo: number; queueLabel: string }> {
  const today = await client.query<{ d: string }>(
    `select (now() at time zone 'Asia/Bangkok')::date::text as d`
  );
  const date = today.rows[0].d;
  const counter = await client.query<{ last_no: number }>(
    `insert into queue_counters (counter_date, last_no) values ($1, 1)
     on conflict (counter_date) do update set last_no = queue_counters.last_no + 1
     returning last_no`,
    [date]
  );
  const queueNo = counter.rows[0].last_no;
  const queueLabel = QUEUE_PREFIX + String(queueNo).padStart(3, "0");
  await client.query(
    `update bookings set queue_no = $1, queue_label = $2, booking_date = $3 where id = $4`,
    [queueNo, queueLabel, date, bookingId]
  );
  return { queueNo, queueLabel };
}

/** เวลาถ่ายเฉลี่ยต่อคิว (rolling avg 10 คิวล่าสุดของวันนี้, fallback 3 นาที, clamp 1–15) */
export async function avgSessionMinutes(): Promise<number> {
  const { rows } = await pool.query<{ avg_min: string | null }>(
    `select avg(extract(epoch from (done_at - called_at))) / 60 as avg_min
     from (
       select done_at, called_at from bookings
       where booking_date = (now() at time zone 'Asia/Bangkok')::date
         and status = 'done' and done_at is not null and called_at is not null
       order by done_at desc limit 10
     ) t`
  );
  const v = Number(rows[0]?.avg_min);
  if (!Number.isFinite(v) || v <= 0) return 3;
  return Math.min(Math.max(v, 1), 15);
}

export async function getPublicQueue(): Promise<QueueState> {
  const { rows } = await pool.query<{ queue_label: string; status: string }>(
    `select queue_label, status from bookings
     where booking_date = (now() at time zone 'Asia/Bangkok')::date
       and status in ('waiting','called','shooting') and queue_no is not null
     order by queue_no asc`
  );
  const shooting = rows.find((r) => r.status === "shooting")?.queue_label ?? null;
  const called = rows.find((r) => r.status === "called")?.queue_label ?? null;
  const waiting = rows.filter((r) => r.status === "waiting").map((r) => r.queue_label);
  return { shooting, called, upNext: waiting.slice(0, 5), waitingCount: waiting.length };
}
