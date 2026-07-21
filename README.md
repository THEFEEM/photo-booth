# Photo Booth Queue

ระบบจองคิว Photo Booth — จอง → ชำระเงิน (PromptPay อัปสลิปให้พนักงานตรวจ / เงินสด) → รับเลขคิว → จอ TV → คอนโซลพนักงาน

Stack: Next.js (App Router) + TypeScript + Tailwind + Supabase (raw pg) — deploy บน Vercel

## หน้าจอ

| Path | ใช้โดย | หน้าที่ |
|---|---|---|
| `/` | ลูกค้า (สแกน QR) | ฟอร์มจองคิว + คำนวณราคา (รูปละ 15 บาท) |
| `/b/<token>` | ลูกค้า | จ่าย PromptPay + อัปสลิป / ดูเลขคิว, คิวก่อนหน้า, เวลารอ (อัปเดตอัตโนมัติ) |
| `/tv` | จอ TV / iPad หน้าบูธ | กำลังถ่าย / เรียกคิว / คิวถัดไป (อัปเดตอัตโนมัติ) |
| `/staff` | พนักงาน (ล็อกอิน PIN) | ตรวจสลิป / เรียกคิว / เรียกซ้ำ / เริ่มถ่าย / เสร็จ / ไม่มา / รับเงินสด / ยกเลิก |

## Flow

- **เงินสด**: ได้เลขคิวทันที สถานะ `unpaid` — พนักงานกด "รับเงินแล้ว" ตอนเรียกคิว (กันจองทิ้ง: เรียกแล้วไม่มา = no-show โดยยังไม่เสียเงิน)
- **PromptPay (ตรวจมือ)**: จอง `pending_payment` → หน้า status แสดง QR ตามยอด → ลูกค้าโอน + อัปสลิป → `pending_verify` → รูปสลิปโผล่ในคอนโซลพนักงาน → กด "สลิปถูกต้อง ออกคิว" (ได้เลขคิว) หรือ "สลิปไม่ผ่าน" (กลับไปให้ลูกค้าอัปใหม่)
- **State machine**: `pending_payment → pending_verify → waiting → called → shooting → done` + `no_show` (requeue ได้) / `cancelled`
- **เลขคิว**: atomic upsert บน `queue_counters` ต่อวัน (โซนเวลา Asia/Bangkok) — ไม่มีเลขซ้ำแม้กดพร้อมกัน
- **เวลารอ**: rolling average 10 คิวล่าสุดของวันนี้ (fallback 3 นาที/คิว)
- **Realtime**: Supabase Realtime broadcast (topic `queue`) + polling fallback 3–5 วิ ทุกจอ

## Setup

### 1. Supabase

1. สร้างโปรเจกต์ → เอา `DATABASE_URL` (transaction pooler), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. **รีวิว** แล้วรันใน SQL Editor ตามลำดับ: `supabase/migrations/0001_init.sql` → `0002_manual_slip_verify.sql`
3. Storage → สร้าง bucket ชื่อ `slips` (private) — จำเป็น ใช้เก็บรูปสลิปให้พนักงานตรวจ

หมายเหตุ: ตารางเปิด RLS แบบไม่มี policy (บล็อก anon/PostgREST) — แอปเชื่อมตรงด้วย raw pg ซึ่ง bypass RLS อยู่แล้ว พนักงานดูสลิปผ่าน signed URL อายุ 1 ชม.

### 2. Env + รัน

```bash
cp .env.example .env.local   # กรอกค่าให้ครบ
npm install
npm run dev
```

`PROMPTPAY_ID` = เบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลักของบัญชีรับเงิน
`DATABASE_URL` password มีอักขระพิเศษต้อง percent-encode (เช่น `@` → `%40`)

### 3. Deploy (Vercel)

ตั้ง env ทั้งหมดใน Vercel → deploy → พิมพ์ QR ชี้ไปที่ root URL ติดหน้าบูธ / เปิด `/tv` บนจอ / พนักงานเปิด `/staff`

## โครงสร้าง

```
src/lib/        db (pg pool + tx), queue (เลขคิว/ETA), promptpay (EMVCo QR),
                staff-auth (PIN + HMAC cookie), realtime (broadcast),
                storage (อัปโหลด + signed URL สลิป), slipok (เตรียมไว้ ยังไม่ใช้)
src/app/api/    bookings (สร้าง/สถานะ/สลิป), queue (public), staff (login/queue/actions)
src/app/        / จอง · /b/[token] สถานะ · /tv จอแสดงคิว · /staff คอนโซล
```

## Phase 2 (ยังไม่ทำ)

ตรวจสลิปอัตโนมัติผ่าน SlipOK (โค้ด `src/lib/slipok.ts` เตรียมไว้แล้ว), แจ้งเตือนใกล้ถึงคิว (LINE OA), dashboard สรุปยอด/no-show rate, พัก-ปิดรับคิว, ส่งรูปผ่าน signed URL, โปรโมชัน, multi-booth
