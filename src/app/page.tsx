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
  const cardOff = "border-zinc-800 bg-zinc-900/80";
  const cardOn = "border-red-600 bg-red-950/30 glow-red";

  return (
    <main className="bg-ahlan mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-10">
      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo imgClass="h-16 w-auto" textClass="text-2xl" />
        <div>
          <p className="text-sm font-light uppercase tracking-[0.4em] text-zinc-400">Photo Booth</p>
          <p className="mt-1 text-xs font-light text-zinc-500">กรอกข้อมูลเพื่อจองคิวถ่ายรูป</p>
        </div>
      </header>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-6">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">ชื่อ / ชื่อตัวแทนกลุ่ม</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="เช่น คุณมิตร"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3.5 text-lg font-light outline-none transition-colors placeholder:text-zinc-600 focus:border-red-600"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-zinc-300">จำนวนคน</span>
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              className="h-11 w-11 rounded-full border border-zinc-700 text-xl font-semibold text-zinc-300 transition-colors active:border-red-600 active:text-red-500"
            >
              −
            </button>
            <span className="text-2xl font-semibold tabular-nums">{partySize} <span className="text-base font-light text-zinc-400">คน</span></span>
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.min(10, n + 1))}
              className="h-11 w-11 rounded-full border border-zinc-700 text-xl font-semibold text-zinc-300 transition-colors active:border-red-600 active:text-red-500"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-zinc-300">จำนวนรูป</span>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPhotoCount(n)}
                className={`${cardBase} px-2 py-4 text-center ${photoCount === n ? cardOn : cardOff}`}
              >
                <div className="text-xl font-semibold">{n} รูป</div>
                <div className={`text-sm ${photoCount === n ? "text-red-400" : "text-zinc-500"}`}>{n * PRICE}.-</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-zinc-300">วิธีชำระเงิน</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("promptpay")}
              className={`${cardBase} px-2 py-4 text-center ${paymentMethod === "promptpay" ? cardOn : cardOff}`}
            >
              <div className="font-semibold">QR PromptPay</div>
              <div className="text-xs font-light text-zinc-500">โอนแล้วอัปโหลดสลิป</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`${cardBase} px-2 py-4 text-center ${paymentMethod === "cash" ? cardOn : cardOff}`}
            >
              <div className="font-semibold">เงินสด</div>
              <div className="text-xs font-light text-zinc-500">ชำระหน้าบูธตอนถึงคิว</div>
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <span className="text-sm font-light text-zinc-400">ยอดชำระ</span>
          <span className="text-3xl font-bold text-red-500">{amount} <span className="text-base font-light text-zinc-400">บาท</span></span>
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-red-600 py-4 text-lg font-semibold tracking-wide text-white transition-colors active:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "กำลังจอง..." : "จองคิว"}
        </button>
      </form>

      <p className="mt-8 text-center text-[11px] font-light uppercase tracking-[0.3em] text-zinc-600">
        AHLAN GROUP · Photo Booth
      </p>
    </main>
  );
}
