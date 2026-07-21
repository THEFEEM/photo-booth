"use client";

import { useEffect, useState } from "react";
import { isSoundEnabled, playSuccess, setSoundEnabled } from "@/lib/sound";

export function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isSoundEnabled());
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
    if (next) playSuccess(); // เล่นทดสอบทันที = ยืนยันว่าปลดล็อกเสียงสำเร็จ
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="เปิด/ปิดเสียงแจ้งเตือน"
      className={`press flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
        on
          ? "bg-red-600 !text-white [-webkit-text-fill-color:#ffffff] glow-red-soft"
          : "border border-neutral-200 bg-white !text-neutral-500 [-webkit-text-fill-color:#737373]"
      } ${className}`}
    >
      {on ? "🔔 เสียงเปิดอยู่" : "🔕 แตะเพื่อเปิดเสียง"}
    </button>
  );
}
