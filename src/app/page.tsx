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

  return (
    <main className="bg-page min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-10 sm:max-w-lg lg:pt-14">
        <header className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo imgClass="h-16 w-auto rounded-[1.3rem] shadow-lg" textClass="text-2xl" />
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.4em] text-neutral-500">Photo Booth</p>
            <p className="mt-1 text-xs font-light text-neutral-500">จองคิวถ่ายรูป ง่ายๆ ใน 3 ขั้นตอน</p>
          </div>
        </header>

        <div className="glass mb-6 rounded-3xl p-4">
          <Steps labels={["กรอกข้อมูลจอง", "ชำระเงิน + อัปสลิป", "รับเลขคิว รอเรียก"]} current={0} />
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col gap-5">
          <div className="glass rounded-3xl p-5">
            <span className="mb-2 block text-sm font-semibold text-neutral-900">ชื่อ / ชื่อตัวแทนกลุ่ม</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="เช่น คุณมิตร"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-lg font-semibold !text-red-600 outline-none transition-colors [-webkit-text-fill-color:#dc2626] placeholder:font-light placeholder:text-neutral-300 placeholder:[-webkit-text-fill-color:#d4d4d4] focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />
            <span className="mb-2 mt-5 block text-sm font-semibold text-neutral-900">จำนวนคน</span>
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-2.5">
              <button
                type="button"
                onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                className="press h-12 w-12 rounded-full bg-neutral-100 text-2xl font-medium text-neutral-700"
              >
                −
              </button>
              <span className="text-3xl font-bold tabular-nums text-red-600">
                {partySize} <span className="text-base font-normal text-neutral-900">คน</span>
              </span>
              <button
                type="button"
                onClick={() => setPartySize((n) => Math.min(10, n + 1))}
                className="press h-12 w-12 rounded-full bg-neutral-900 text-2xl font-medium text-white [-webkit-text-fill-color:#ffffff]"
              >
                +
              </button>
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-neutral-900">จำนวนรูป</span>
              <span className="text-xs font-light text-neutral-500">รูปละ {PRICE_PER_PHOTO_THB} บาท ไม่จำกัดจำนวน</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-2.5">
              <button
                type="button"
                onClick={() => setPhotoCount((n) => Math.max(1, n - 1))}
                className="press h-12 w-12 rounded-full bg-neutral-100 text-2xl font-medium text-neutral-700"
              >
                −
              </button>
              <div className="text-center">
                <div className="text-3xl font-bold tabular-nums text-red-600">
                  {photoCount} <span className="text-base font-normal text-neutral-900">รูป</span>
                </div>
                <div className="text-sm font-semibold text-red-600">= {amount.toLocaleString()} บาท</div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoCount((n) => Math.min(MAX_PHOTOS, n + 1))}
                className="press h-12 w-12 rounded-full bg-neutral-900 text-2xl font-medium text-white [-webkit-text-fill-color:#ffffff]"
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
                  className={`press rounded-2xl py-2.5 text-sm font-bold transition-all duration-200 ${
                    photoCount === n
                      ? "bg-red-600 !text-white [-webkit-text-fill-color:#ffffff] glow-red-soft"
                      : "border border-red-200 bg-white !text-red-600 [-webkit-text-fill-color:#dc2626]"
                  }`}
                >
                  {n} รูป
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <span className="mb-2 block text-sm font-semibold text-neutral-900">วิธีชำระเงิน</span>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: "promptpay", title: "QR PromptPay", sub: "สแกนจ่าย + อัปสลิป" },
                  { key: "cash", title: "เงินสด", sub: "ชำระหน้าบูธตอนถึงคิว" },
                ] as const
              ).map((m) => {
                const active = paymentMethod === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key)}
                    className={`press rounded-2xl px-2 py-5 text-center transition-all duration-200 ${
                      active
                        ? "bg-red-600 glow-red-soft"
                        : "border border-red-200 bg-white"
                    }`}
                  >
                    <div className={`text-base font-bold ${active ? "!text-white [-webkit-text-fill-color:#ffffff]" : "!text-red-600 [-webkit-text-fill-color:#dc2626]"}`}>
                      {m.title}
                    </div>
                    <div className={`mt-0.5 text-xs ${active ? "!text-white/80 [-webkit-text-fill-color:rgba(255,255,255,0.8)]" : "!text-neutral-500 [-webkit-text-fill-color:#737373]"}`}>
                      {m.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-strong flex items-center justify-between rounded-3xl px-6 py-4">
            <span className="text-sm font-semibold text-neutral-900">ยอดชำระทั้งหมด</span>
            <span className="text-3xl font-bold text-red-600">
              {amount.toLocaleString()} <span className="text-base font-normal text-neutral-900">บาท</span>
            </span>
          </div>

          {error && <p className="text-center text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="press rounded-2xl bg-red-600 py-5 text-xl font-semibold tracking-wide !text-white [-webkit-text-fill-color:#ffffff] glow-red-soft disabled:opacity-50"
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
