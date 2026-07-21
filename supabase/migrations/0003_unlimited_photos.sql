-- 0003_unlimited_photos.sql — ปลดลิมิตจำนวนรูป (เดิม 1–3) เป็น 1–99
-- ** รีวิวก่อนรันจริงเสมอ ** — idempotent

alter table bookings drop constraint if exists bookings_photo_count_check;
alter table bookings add constraint bookings_photo_count_check
  check (photo_count between 1 and 99);
