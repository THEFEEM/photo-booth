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
      setError("รหัสไม่ถูกต้อง");
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
      <main className="bg-ahlan flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-light text-zinc-600">กำลังโหลด...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="bg-ahlan flex min-h-screen flex-col items-center justify-center gap-8 px-6">
        <div className="flex flex-col items-center gap-3">
          <Logo imgClass="h-20 w-auto rounded-2xl" textClass="text-2xl" />
          <p className="text-xs font-light uppercase tracking-[0.5em] text-zinc-500">Photo Booth System</p>
        </div>
        <div className="flex w-full max-w-xs flex-col items-center gap-5">
          <p className="text-sm font-light text-zinc-400">ใส่รหัส 6 หลักเพื่อเข้าสู่ระบบ</p>
          <div className="relative w-full">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => onPinChange(e.target.value)}
              disabled={submitting}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-4 text-center text-3xl tracking-[0.9em] text-zinc-100 outline-none transition-colors focus:border-red-600 disabled:opacity-50"
            />
            <div className="pointer-events-none absolute inset-x-0 -bottom-6 flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${i < pin.length ? "bg-red-500" : "bg-zinc-700"}`}
                />
              ))}
            </div>
          </div>
          <div className="h-6 pt-4">
            {error && <p className="text-sm text-red-400">{error}</p>}
            {submitting && <p className="animate-pulse text-sm font-light text-zinc-500">กำลังตรวจสอบ...</p>}
          </div>
        </div>
      </main>
    );
  }

  const menus = [
    { href: "/staff", title: "คอนโซลพนักงาน", sub: "ตรวจสลิป · เรียกคิว · จัดการคิว", accent: true },
    { href: "/dashboard", title: "แดชบอร์ด", sub: "ยอดขาย · สถิติคิว · Export CSV", accent: false },
    { href: "/qr", title: "จอ QR ลูกค้า", sub: "QR สแกนจอง + คิวปัจจุบัน (ตั้งหน้าบูธ)", accent: false },
    { href: "/tv", title: "จอแสดงคิว TV", sub: "กำลังถ่าย + คิวถัดไป (จอใหญ่)", accent: false },
    { href: "/", title: "หน้าจองของลูกค้า", sub: "เปิดดู / ทดสอบการจอง", accent: false },
  ];

  return (
    <main className="bg-ahlan flex min-h-screen flex-col items-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-8 md:max-w-2xl">
        <header className="flex flex-col items-center gap-2 text-center">
          <Logo imgClass="h-16 w-auto rounded-2xl" textClass="text-xl" />
          <p className="text-xs font-light uppercase tracking-[0.5em] text-zinc-500">เลือกหน้าที่ต้องการเปิด</p>
        </header>
        <nav className="grid gap-3 md:grid-cols-2">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`group flex items-center justify-between rounded-2xl border p-5 transition-colors ${
                m.accent
                  ? "border-red-800 bg-red-950/30 active:bg-red-950/60"
                  : "border-zinc-800 bg-zinc-900/70 active:bg-zinc-800"
              }`}
            >
              <div>
                <div className={`font-semibold ${m.accent ? "text-red-300" : "text-zinc-100"}`}>{m.title}</div>
                <div className="text-sm font-light text-zinc-500">{m.sub}</div>
              </div>
              <span className={`text-xl ${m.accent ? "text-red-500" : "text-zinc-600"}`}>›</span>
            </Link>
          ))}
        </nav>
        <p className="text-center text-[11px] font-light uppercase tracking-[0.3em] text-zinc-600">AHLAN GROUP</p>
      </div>
    </main>
  );
}
