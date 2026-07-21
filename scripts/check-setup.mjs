// ตรวจความพร้อมระบบ: node scripts/check-setup.mjs
import { readFileSync } from "fs";
import { Pool } from "pg";

// --- โหลด .env.local ---
let envRaw;
try {
  envRaw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
} catch {
  console.error("❌ ไม่พบไฟล์ .env.local");
  process.exit(1);
}
const env = {};
for (const line of envRaw.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/\r$/, "");
}

const ok = (msg) => console.log("✅", msg);
const bad = (msg) => { console.log("❌", msg); failed = true; };
let failed = false;

// --- 1. env ---
for (const k of ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "PROMPTPAY_ID", "STAFF_PIN"]) {
  env[k] ? ok(`env ${k} มีค่า`) : bad(`env ${k} ว่าง`);
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// --- 2. Database ---
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 8000,
});
try {
  await pool.query("select 1");
  ok("ต่อ Database ได้");
  const t = await pool.query(
    `select table_name from information_schema.tables
     where table_schema='public' and table_name in ('bookings','payments','queue_counters')`
  );
  t.rowCount === 3
    ? ok("ตารางครบ (bookings, payments, queue_counters)")
    : bad(`ตารางไม่ครบ เจอ: ${t.rows.map((r) => r.table_name).join(", ") || "ไม่มีเลย"} — รัน migration 0001`);
  const c = await pool.query(
    `select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'bookings_status_check'`
  );
  c.rows[0]?.def?.includes("pending_verify")
    ? ok("migration 0002 รันแล้ว (มี pending_verify)")
    : bad("ยังไม่ได้รัน migration 0002 (ไม่มี pending_verify)");
} catch (e) {
  bad(`Database: ${e.message}`);
} finally {
  await pool.end().catch(() => {});
}

// --- 3. Storage ---
try {
  const res = await fetch(`${URL_}/storage/v1/bucket`, {
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    bad(`Storage list buckets: HTTP ${res.status} ${JSON.stringify(body)} — เช็ค SUPABASE_SERVICE_ROLE_KEY`);
  } else {
    const names = (body ?? []).map((b) => b.name);
    ok(`ต่อ Storage ได้ — buckets: [${names.join(", ") || "ว่าง"}]`);
    if (!names.includes("slips")) {
      bad("ไม่มี bucket 'slips' — สร้างที่ Dashboard → Storage → New bucket ชื่อ slips (private)");
    } else {
      // ทดสอบอัปโหลด + signed URL + ลบ
      const up = await fetch(`${URL_}/storage/v1/object/slips/_check.txt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "text/plain", "x-upsert": "true" },
        body: "check",
      });
      up.ok ? ok("อัปโหลดไฟล์ทดสอบเข้า slips ได้") : bad(`อัปโหลดไม่ได้: HTTP ${up.status} ${await up.text()}`);
      const sign = await fetch(`${URL_}/storage/v1/object/sign/slips/_check.txt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 60 }),
      });
      sign.ok ? ok("สร้าง signed URL ได้ (พนักงานดูสลิปได้)") : bad(`signed URL ไม่ได้: HTTP ${sign.status}`);
      await fetch(`${URL_}/storage/v1/object/slips/_check.txt`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${KEY}` },
      });
    }
  }
} catch (e) {
  bad(`Storage: ${e.message}`);
}

console.log(failed ? "\n⚠️  มีรายการไม่ผ่าน — แก้ตามข้อความด้านบนแล้วรันใหม่" : "\n🎉 ระบบพร้อมใช้งานครบทุกส่วน");
process.exit(failed ? 1 : 0);
