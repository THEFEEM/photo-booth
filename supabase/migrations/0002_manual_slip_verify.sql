-- 0002_manual_slip_verify.sql — เปลี่ยนเป็นพนักงานตรวจสลิปเอง (ยังไม่ใช้ SlipOK)
-- ** รีวิวก่อนรันจริงเสมอ ** — idempotent, รันหลัง 0001
-- state ใหม่: pending_payment -> (อัปสลิป) pending_verify -> (staff อนุมัติ) waiting
--                                        \-> (staff ปฏิเสธ) กลับ pending_payment

alter table bookings add column if not exists slip_path        text;
alter table bookings add column if not exists slip_uploaded_at timestamptz;
alter table bookings add column if not exists slip_rejected_at timestamptz;

alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('pending_payment','pending_verify','waiting','called','shooting','done','no_show','cancelled'));

create index if not exists idx_bookings_pending_verify
  on bookings (booking_date) where status = 'pending_verify';
