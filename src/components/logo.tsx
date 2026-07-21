"use client";

import { useState } from "react";

/** โลโก้ AHLAN GROUP — ใช้ /logo.png ถ้ามี, fallback เป็น wordmark */
export function Logo({
  imgClass = "h-10 w-auto",
  textClass = "text-lg",
}: {
  imgClass?: string;
  textClass?: string;
}) {
  const [imgOk, setImgOk] = useState(true);
  if (imgOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/logo.png" alt="AHLAN GROUP" className={imgClass} onError={() => setImgOk(false)} />
    );
  }
  return (
    <div className={`font-semibold tracking-[0.35em] ${textClass}`}>
      AHLAN&nbsp;<span className="text-red-600">GROUP</span>
    </div>
  );
}
