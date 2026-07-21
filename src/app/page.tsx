"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

const PRICE = 15;

export default function BookingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [photoCount, setPhotoCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"promptpay" | "cash">("promptpay");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = useMemo(() => photoCount * PRICE, [photoCount]);

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

  const cardBase = "rounded-2xl border transition-all duration-200";
  const cardOff = "border-stone-200 bg-white";
  const cardOn = "border-rose-300 bg-rose-50 shadow-[0_6px_20px_-8px_rgba(244,114,142,0.45)]";

  return (
    <main className="bg-cream min-h-screen w-full text-stone-800">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-10 sm:max-w-lg lg:pt-14">
      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo imgClass="h-16 w-auto rounded-2xl" textClass="text-2xl text-stone-900" />
        <div>
          <p className="text-sm font-light uppercase tracking-[0.4em] text-stone-500">Photo Booth</p>
          <p className="mt-1 text-xs font-light text-stone-400">กรอกข้อมูลเพื่อจองคิวถ่ายรูป</p>
        </div>
      </header>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-6">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-600">ชื่อ / ชื่อตัวแทนกลุ่ม</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="เช่น คุณมิตร"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-lg font-light outline-none transition-colors placeholder:text-stone-300 focus:border-rose-300"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-stone-600">จำนวนคน</span>
          <div className="card-cream flex items-center justify-between rounded-2xl px-4 py-3">
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              className="h-11 w-11 rounded-full border border-stone-200 text-xl font-medium text-stone-500 transition-colors active:border-rose-300 active:text-rose-400"
            >
              −
            </button>
            <span className="text-2xl font-semibold tabular-nums text-stone-800">
              {partySize} <span className="text-base font-light text-stone-400">คน</span>
            </span>
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.min(10, n + 1))}
              className="h-11 w-11 rounded-full border border-stone-200 text-xl font-medium text-stone-500 transition-colors active:border-rose-300 active:text-rose-400"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-stone-600">จำนวนรูป</span>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPhotoCount(n)}
                className={`${cardBase} px-2 py-4 text-center ${photoCount === n ? cardOn : cardOff}`}
              >
                <div className="text-xl font-semibold text-stone-800">{n} รูป</div>
                <div className={`text-sm ${photoCount === n ? "text-rose-400" : "text-stone-400"}`}>{n * PRICE}.-</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-stone-600">วิธีชำระเงิน</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("promptpay")}
              className={`${cardBase} px-2 py-4 text-center ${paymentMethod === "promptpay" ? cardOn : cardOff}`}
            >
              <div className="font-semibold text-stone-800">QR PromptPay</div>
              <div className="text-xs font-light text-stone-400">โอนแล้วอัปโหลดสลิป</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`${cardBase} px-2 py-4 text-center ${paymentMethod === "cash" ? cardOn : cardOff}`}
            >
              <div className="font-semibold text-stone-800">เงินสด</div>
              <div className="text-xs font-light text-stone-400">ชำระหน้าบูธตอนถึงคิว</div>
            </button>
          </div>
        </div>

        <div className="card-cream flex items-baseline justify-between rounded-2xl px-5 py-4">
          <span className="text-sm font-light text-stone-500">ยอดชำระ</span>
          <span className="text-3xl font-bold text-rose-400">
            {amount} <span className="text-base font-light text-stone-400">บาท</span>
          </span>
        </div>

        {error && <p className="text-center text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-rose-400 py-4 text-lg font-semibold tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(244,114,142,0.7)] transition-colors active:bg-rose-500 disabled:opacity-50"
        >
          {submitting ? "กำลังจอง..." : "จองคิว"}
        </button>
      </form>

      <p className="mt-8 text-center text-[11px] font-light uppercase tracking-[0.3em] text-stone-400">
        AHLAN GROUP · Photo Booth
      </p>
    </div>
    </main>
  );
}
