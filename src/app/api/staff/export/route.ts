import { pool } from "@/lib/db";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

/** Export CSV รายวัน (เปิดใน Excel ได้ มี BOM) */
export async function GET(req: Request) {
  if (!(await requireStaff())) return new Response("unauthorized", { status: 401 });

  const url = new URL(req.url);
  const raw = url.searchParams.get("date");
  const date =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : (await pool.query<{ d: string }>(`select (now() at time zone 'Asia/Bangkok')::date::text as d`)).rows[0].d;

  const { rows } = await pool.query(
    `select queue_label, name, party_size, photo_count, amount_thb, payment_method, payment_status, status,
            to_char(created_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') as created_at,
            to_char(done_at at time zone 'Asia/Bangkok', 'HH24:MI:SS') as done_at
     from bookings where booking_date = $1 order by created_at asc`,
    [date]
  );

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["เลขคิว", "ชื่อ", "จำนวนคน", "จำนวนรูป", "ยอด(บาท)", "วิธีจ่าย", "สถานะจ่าย", "สถานะคิว", "เวลาจอง", "เวลาเสร็จ"];
  const lines = rows.map((r) =>
    [r.queue_label, r.name, r.party_size, r.photo_count, r.amount_thb, r.payment_method, r.payment_status, r.status, r.created_at, r.done_at]
      .map(esc)
      .join(",")
  );
  const csv = "\uFEFF" + header.map(esc).join(",") + "\n" + lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ahlan-queue-${date}.csv"`,
    },
  });
}
