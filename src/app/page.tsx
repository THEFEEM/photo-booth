"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Steps } from "@/components/steps";
import { MAX_PHOTOS, PRICE_PER_PHOTO_THB } from "@/lib/pricing";

export default function BookingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [photoCount, setPhotoCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"promptpay" | "cash">("promptpay");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = useMemo(() => photoCount * PRICE_PER_PHOTO_THB, [photoCount]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), partySize, photoCount, paymentMethod }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
      router.push(`/b/${body.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
      setSubmitting(false);
    }
  }

  const selCard = "press rounded-2xl border text-center text-neutral-800 transition-all duration-200";
  const on = "border-red-500 bg-red-50/80 glow-red-soft";
  const off = "border-neutral-200 bg-white/80";

  return (
    <main className="bg-page min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-10 sm:max-w-lg lg:pt-14">
        <header className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo imgClass="h-16 w-auto rounded-[1.3rem] shadow-lg" textClass="text-2xl" />
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.4em] text-neutral-500">Photo Booth</p>
            <p className="mt-1 text-xs font-light text-neutral-400">จองคิวถ่ายรูป ง่ายๆ ใน 3 ขั้นตอน</p>
          </div>
        </header>

        <div className="glass mb-6 rounded-3xl p-4">
          <Steps labels={["กรอกข้อมูลจอง", "ชำระเงิน + อัปสลิป", "รับเลขคิว รอเรียก"]} current={0} />
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col gap-5">
          <div className="glass rounded-3xl p-5">
            <span className="mb-2 block text-sm font-medium text-neutral-600">ชื่อ / ชื่อตัวแทนกลุ่ม</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="เช่น คุณมิตร"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-lg outline-none transition-colors placeholder:text-neutral-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
            <span className="mb-2 mt-5 block text-sm font-medium text-neutral-600">จำนวนคน</span>
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-2.5">
              <button
                type="button"
                onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                className="press h-12 w-12 rounded-full bg-neutral-100 text-2xl font-medium text-neutral-600"
              >
                −
              </button>
              <span className="text-2xl font-semibold tabular-nums">
                {partySize} <span className="text-base font-light text-neutral-400">คน</span>
              </span>
              <button
                type="button"
                onClick={() => setPartySize((n) => Math.min(10, n + 1))}
                className="press h-12 w-12 rounded-full bg-neutral-900 text-2xl font-medium text-white"
              >
                +
              </button>
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium text-neutral-600">จำนวนรูป</span>
              <span className="text-xs font-light text-neutral-400">รูปละ {PRICE_PER_PHOTO_THB} บาท ไม่จำกัดจำนวน</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-2.5">
              <button
                type="button"
                onClick={() => setPhotoCount((n) => Math.max(1, n - 1))}
                className="press h-12 w-12 rounded-full bg-neutral-100 text-2xl font-medium text-neutral-600"
              >
                −
              </button>
              <div className="text-center">
                <div className="text-2xl font-semibold tabular-nums">
                  {photoCount} <span className="text-base font-light text-neutral-400">รูป</span>
                </div>
                <div className="text-xs text-red-500">= {amount.toLocaleString()} บาท</div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoCount((n) => Math.min(MAX_PHOTOS, n + 1))}
                className="press h-12 w-12 rounded-full bg-neutral-900 text-2xl font-medium text-white"
              >
                +
              </button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPhotoCount(n)}
                  className={`${selCard} py-2 text-sm font-medium ${photoCount === n ? on : off}`}
                >
                  {n} รูป
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <span className="mb-2 block text-sm font-medium text-neutral-600">วิธีชำระเงิน</span>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPaymentMethod("promptpay")} className={`${selCard} px-2 py-4 ${paymentMethod === "promptpay" ? on : off}`}>
                <div className="font-semibold">QR PromptPay</div>
                <div className="text-xs font-light text-neutral-400">สแกนจ่าย + อัปสลิป</div>
              </button>
              <button type="button" onClick={() => setPaymentMethod("cash")} className={`${selCard} px-2 py-4 ${paymentMethod === "cash" ? on : off}`}>
                <div className="font-semibold">เงินสด</div>
                <div className="text-xs font-light text-neutral-400">ชำระหน้าบูธตอนถึงคิว</div>
              </button>
            </div>
          </div>

          <div className="glass-strong flex items-center justify-between rounded-3xl px-6 py-4">
            <span className="text-sm text-neutral-500">ยอดชำระทั้งหมด</span>
            <span className="text-3xl font-bold text-red-600">
              {amount.toLocaleString()} <span className="text-base font-light text-neutral-400">บาท</span>
            </span>
          </div>

          {error && <p className="text-center text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="press rounded-2xl bg-red-600 py-5 text-xl font-semibold tracking-wide text-white glow-red-soft disabled:opacity-50"
          >
            {submitting ? "กำลังจอง..." : "จองคิว"}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] font-light uppercase tracking-[0.3em] text-neutral-400">
          AHLAN GROUP · Photo Booth
        </p>
      </div>
    </main>
  );
}
