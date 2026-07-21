"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AppHubPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const check = useCallback(async () => {
    const res = await fetch("/api/staff/session", { cache: "no-store" });
    if (res.ok) setAuthed((await res.json()).authed);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  async function login(value: string) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: value }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("รหัสไม่ถูกต้อง ลองใหม่อีกครั้ง");
      setPin("");
      return;
    }
    setAuthed(true);
  }

  function onPinChange(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    setError(null);
    if (digits.length === 6) login(digits);
  }

  if (authed === null) {
    return (
      <main className="bg-page flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-light text-neutral-400">กำลังโหลด...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="bg-page flex min-h-screen items-center justify-center px-6">
        <div className="glass-strong flex w-full max-w-sm flex-col items-center gap-6 rounded-[2rem] p-8">
          <Logo imgClass="h-20 w-auto rounded-[1.4rem] shadow-lg" textClass="text-2xl" />
          <div className="text-center">
            <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
            <p className="mt-1 text-sm font-light text-neutral-400">ใส่รหัสผ่าน 6 หลักสำหรับพนักงาน</p>
          </div>
          <div className="w-full">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => onPinChange(e.target.value)}
              disabled={submitting}
              className="w-full rounded-2xl border border-neutral-200 bg-white py-4 text-center text-3xl tracking-[0.8em] outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
            />
            <div className="mt-3 flex justify-center gap-2.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${i < pin.length ? "scale-110 bg-red-500" : "bg-neutral-200"}`}
                />
              ))}
            </div>
          </div>
          <div className="h-5">
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            {submitting && <p className="animate-pulse text-sm font-light text-neutral-400">กำลังตรวจสอบ...</p>}
          </div>
          <p className="text-[11px] font-light uppercase tracking-[0.4em] text-neutral-300">AHLAN GROUP</p>
        </div>
      </main>
    );
  }

  const menus = [
    { href: "/staff", title: "คอนโซลพนักงาน", sub: "ตรวจสลิป · เรียกคิว · จัดการคิว", primary: true },
    { href: "/dashboard", title: "แดชบอร์ด", sub: "ยอดขาย · สถิติคิว · Export CSV", primary: false },
    { href: "/qr", title: "จอ QR ลูกค้า", sub: "QR สแกนจอง + คิวปัจจุบัน (ตั้งหน้าบูธ)", primary: false },
    { href: "/tv", title: "จอแสดงคิว TV", sub: "กำลังถ่าย + คิวถัดไป (จอใหญ่)", primary: false },
    { href: "/", title: "หน้าจองของลูกค้า", sub: "เปิดดู / ทดสอบการจอง", primary: false },
  ];

  return (
    <main className="bg-page flex min-h-screen flex-col items-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-8 md:max-w-2xl">
        <header className="flex flex-col items-center gap-2 text-center">
          <Logo imgClass="h-16 w-auto rounded-[1.3rem] shadow-lg" textClass="text-xl" />
          <p className="text-xs font-light uppercase tracking-[0.5em] text-neutral-400">เลือกหน้าที่ต้องการเปิด</p>
        </header>
        <nav className="grid gap-3 md:grid-cols-2">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`press group flex items-center justify-between rounded-3xl p-5 ${
                m.primary ? "bg-red-600 text-white glow-red-soft" : "glass"
              }`}
            >
              <div>
                <div className={`font-semibold ${m.primary ? "text-white" : "text-neutral-900"}`}>{m.title}</div>
                <div className={`text-sm font-light ${m.primary ? "text-white/70" : "text-neutral-400"}`}>{m.sub}</div>
              </div>
              <span className={`text-2xl transition-transform group-hover:translate-x-0.5 ${m.primary ? "text-white/80" : "text-neutral-300"}`}>›</span>
            </Link>
          ))}
        </nav>
        <p className="text-center text-[11px] font-light uppercase tracking-[0.3em] text-neutral-300">AHLAN GROUP</p>
      </div>
    </main>
  );
}
