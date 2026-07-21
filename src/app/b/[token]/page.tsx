"use client";

import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { useQueueUpdates } from "@/lib/use-queue-updates";
import type { BookingStatusResponse } from "@/lib/types";

export default function BookingStatusPage() {
  const { token } = useParams<{ token: string }>();
  const [b, setB] = useState<BookingStatusResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/bookings/${token}`, { cache: "no-store" });
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    if (res.ok) setB(await res.json());
  }, [token]);

  useQueueUpdates(load, 5000);

  async function uploadSlip(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setSlipError("กรุณาเลือกรูปสลิป");
      return;
    }
    setUploading(true);
    setSlipError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/bookings/${token}/slip`, { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "อัปโหลดสลิปไม่สำเร็จ");
      await load();
    } catch (err) {
      setSlipError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setUploading(false);
    }
  }

  if (notFound) {
    return <Center><p className="font-light text-stone-400">ไม่พบการจองนี้</p></Center>;
  }
  if (!b) {
    return <Center><p className="animate-pulse font-light text-stone-400">กำลังโหลด...</p></Center>;
  }

  const called = b.status === "called";

  return (
    <main className={`${called ? "bg-cream-called" : "bg-cream"} mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 pb-10 pt-10 text-stone-800`}>
      <header className="flex flex-col items-center gap-2 text-center">
        <Logo imgClass="h-12 w-auto rounded-xl" textClass="text-xl text-stone-900" />
        <p className="text-sm font-light text-stone-500">
          {b.name} · {b.partySize} คน · {b.photoCount} รูป · {b.amountThb} บาท
        </p>
      </header>

      {b.status === "pending_payment" && (
        <section className="card-cream flex flex-col items-center gap-4 rounded-3xl p-6">
          {b.slipRejected && (
            <p className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-center text-sm text-rose-500">
              สลิปไม่ผ่านการตรวจสอบ — เช็คยอดโอนแล้วอัปโหลดใหม่ หรือติดต่อพนักงาน
            </p>
          )}
          <h2 className="font-semibold">สแกนจ่าย <span className="text-rose-400">{b.amountThb} บาท</span></h2>
          {b.promptpayQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.promptpayQr} alt="PromptPay QR" className="w-64 rounded-2xl border border-stone-100" />
          ) : (
            <p className="text-sm text-amber-500">ยังไม่ได้ตั้งค่า PromptPay — สอบถามพนักงาน</p>
          )}
          <form onSubmit={uploadSlip} className="flex w-full flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm font-light text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-800 file:px-3 file:py-2 file:font-medium file:text-white"
            />
            {slipError && <p className="text-center text-sm text-rose-500">{slipError}</p>}
            <button
              disabled={uploading}
              className="rounded-2xl bg-rose-400 py-3.5 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(244,114,142,0.7)] transition-colors active:bg-rose-500 disabled:opacity-50"
            >
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดสลิป"}
            </button>
          </form>
          <p className="text-center text-xs font-light text-stone-400">
            โอนเงินแล้วอัปโหลดสลิป — พนักงานตรวจสอบแล้วออกเลขคิวให้ทันที
          </p>
        </section>
      )}

      {b.status === "pending_verify" && (
        <section className="card-cream flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <span className="h-3 w-3 animate-ping rounded-full bg-rose-400" />
          </div>
          <h2 className="text-lg font-semibold">ส่งสลิปแล้ว รอพนักงานตรวจสอบ</h2>
          <p className="text-sm font-light text-stone-400">
            โดยปกติไม่เกิน 1–2 นาที — หน้านี้จะอัปเดตเลขคิวให้อัตโนมัติ
          </p>
        </section>
      )}

      {(b.status === "waiting" || called) && b.queueLabel && (
        <section
          className={`flex flex-col items-center gap-2 rounded-3xl p-8 ${
            called
              ? "animate-pulse bg-rose-400 text-white shadow-[0_18px_44px_-12px_rgba(244,114,142,0.8)]"
              : "card-cream"
          }`}
        >
          {called ? (
            <h2 className="text-xl font-semibold">ถึงคิวคุณแล้ว เชิญที่บูธ</h2>
          ) : (
            <h2 className="font-semibold text-stone-500">จองสำเร็จ — เลขคิวของคุณ</h2>
          )}
          <div className={`text-8xl font-extrabold tracking-[0.08em] ${called ? "text-white" : "text-stone-900"}`}>
            {b.queueLabel}
          </div>
          {b.status === "waiting" && (
            <div className="mt-2 flex gap-6 text-center font-light text-stone-500">
              <p>คิวก่อนหน้า <b className="font-semibold text-stone-800">{b.position ?? "-"}</b> คิว</p>
              <p>รอประมาณ <b className="font-semibold text-stone-800">{b.etaMinutes ?? "-"}</b> นาที</p>
            </div>
          )}
          {b.paymentMethod === "cash" && b.paymentStatus === "unpaid" && (
            <p className={`mt-2 rounded-xl px-3 py-2 text-sm ${called ? "bg-white/20 text-white" : "border border-amber-200 bg-amber-50 text-amber-600"}`}>
              ชำระเงินสด {b.amountThb} บาท กับพนักงานตอนถึงคิว
            </p>
          )}
        </section>
      )}

      {b.status === "shooting" && <Big label={b.queueLabel} title="กำลังถ่ายรูป" sub="ขอให้สนุกกับการถ่ายรูป" />}
      {b.status === "done" && <Big label={b.queueLabel} title="เสร็จเรียบร้อย" sub="ขอบคุณที่ใช้บริการ AHLAN GROUP" />}
      {b.status === "no_show" && <Big label={b.queueLabel} title="เรียกคิวแล้วไม่พบ" sub="ติดต่อพนักงานเพื่อกลับเข้าคิว" />}
      {b.status === "cancelled" && <Big label={b.queueLabel} title="ยกเลิกแล้ว" sub="" />}

      <p className="mt-auto text-center text-[11px] font-light uppercase tracking-[0.3em] text-stone-400">
        หน้านี้อัปเดตอัตโนมัติ · เก็บลิงก์ไว้เช็คคิว
      </p>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="bg-cream flex min-h-screen items-center justify-center px-5">{children}</main>;
}

function Big({ label, title, sub }: { label: string | null; title: string; sub: string }) {
  return (
    <section className="card-cream flex flex-col items-center gap-2 rounded-3xl p-8">
      <h2 className="text-xl font-semibold text-stone-700">{title}</h2>
      {label && <div className="text-7xl font-extrabold tracking-[0.08em] text-stone-900">{label}</div>}
      {sub && <p className="text-sm font-light text-stone-400">{sub}</p>}
    </section>
  );
}
