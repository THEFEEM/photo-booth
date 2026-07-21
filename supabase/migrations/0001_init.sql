-- Photo Booth Queue — 0001_init.sql
-- ** รีวิวก่อนรันจริงเสมอ **

create extension if not exists pgcrypto;

-- ตัวนับเลขคิวต่อวัน (atomic ผ่าน upsert)
create table if not exists queue_counters (
  counter_date date primary key,
  last_no      integer not null default 0
);

create table if not exists bookings (
  id             uuid primary key default gen_random_uuid(),
  token          text not null unique default encode(gen_random_bytes(16), 'hex'),
  booking_date   date not null default ((now() at time zone 'Asia/Bangkok')::date),
  queue_no       integer,
  queue_label    text,
  name           text not null check (char_length(name) between 1 and 50),
  party_size     integer not null check (party_size between 1 and 10),
  photo_count    integer not null check (photo_count between 1 and 3),
  amount_thb     numeric(10,2) not null check (amount_thb >= 0),
  payment_method text not null check (payment_method in ('promptpay','cash')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  -- state machine: pending_payment -> waiting -> called -> shooting -> done
  --                + no_show (จาก called, requeue กลับ waiting ได้) / cancelled
  status         text not null default 'pending_payment'
                 check (status in ('pending_payment','waiting','called','shooting','done','no_show','cancelled')),
  call_count     integer not null default 0,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz,
  called_at      timestamptz,
  shooting_at    timestamptz,
  done_at        timestamptz,
  unique (booking_date, queue_no)
);

create index if not exists idx_bookings_date_status on bookings (booking_date, status);
create index if not exists idx_bookings_date_queue  on bookings (booking_date, queue_no);

create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references bookings(id) on delete cascade,
  trans_ref       text not null unique,   -- กันสลิปซ้ำระดับ DB
  amount_thb      numeric(10,2) not null,
  sending_bank    text,
  receiving_bank  text,
  trans_timestamp timestamptz,
  slip_path       text,                   -- path ใน storage bucket "slips"
  raw             jsonb,                  -- response เต็มจาก SlipOK (หลักฐาน)
  created_at      timestamptz not null default now()
);

create index if not exists idx_payments_booking on payments (booking_id);

-- แอปเชื่อมตรงด้วย raw pg (bypass RLS) — เปิด RLS แบบไม่มี policy
-- เพื่อบล็อก PostgREST/anon key ไม่ให้อ่านตารางตรง
alter table bookings       enable row level security;
alter table payments       enable row level security;
alter table queue_counters enable row level security;
