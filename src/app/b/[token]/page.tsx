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
    return <Center><p className="font-light text-zinc-500">ไม่พบการจองนี้</p></Center>;
  }
  if (!b) {
    return <Center><p className="animate-pulse font-light text-zinc-600">กำลังโหลด...</p></Center>;
  }

  const called = b.status === "called";

  return (
    <main className={`${called ? "bg-ahlan-called" : "bg-ahlan"} mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 pb-10 pt-10`}>
      <header className="flex flex-col items-center gap-2 text-center">
        <Logo imgClass="h-12 w-auto" textClass="text-xl" />
        <p className="text-sm font-light text-zinc-400">
          {b.name} · {b.partySize} คน · {b.photoCount} รูป · {b.amountThb} บาท
        </p>
      </header>

      {b.status === "pending_payment" && (
        <section className="flex flex-col items-center gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
          {b.slipRejected && (
            <p className="w-full rounded-xl border border-red-900 bg-red-950/60 px-3 py-2.5 text-center text-sm text-red-300">
              สลิปไม่ผ่านการตรวจสอบ — เช็คยอดโอนแล้วอัปโหลดใหม่ หรือติดต่อพนักงาน
            </p>
          )}
          <h2 className="font-semibold">สแกนจ่าย <span className="text-red-500">{b.amountThb} บาท</span></h2>
          {b.promptpayQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.promptpayQr} alt="PromptPay QR" className="w-64 rounded-2xl bg-white p-2" />
          ) : (
            <p className="text-sm text-amber-400">ยังไม่ได้ตั้งค่า PromptPay — สอบถามพนักงาน</p>
          )}
          <form onSubmit={uploadSlip} className="flex w-full flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-sm font-light file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:font-medium file:text-zinc-100"
            />
            {slipError && <p className="text-center text-sm text-red-400">{slipError}</p>}
            <button
              disabled={uploading}
              className="rounded-2xl bg-red-600 py-3.5 font-semibold text-white transition-colors active:bg-red-700 disabled:opacity-50"
            >
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดสลิป"}
            </button>
          </form>
          <p className="text-center text-xs font-light text-zinc-500">
            โอนเงินแล้วอัปโหลดสลิป — พนักงานตรวจสอบแล้วออกเลขคิวให้ทันที
          </p>
        </section>
      )}

      {b.status === "pending_verify" && (
        <section className="flex flex-col items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-800 bg-red-950/50">
            <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
          </div>
          <h2 className="text-lg font-semibold">ส่งสลิปแล้ว รอพนักงานตรวจสอบ</h2>
          <p className="text-sm font-light text-zinc-400">
            โดยปกติไม่เกิน 1–2 นาที — หน้านี้จะอัปเดตเลขคิวให้อัตโนมัติ
          </p>
        </section>
      )}

      {(b.status === "waiting" || called) && b.queueLabel && (
        <section
          className={`flex flex-col items-center gap-2 rounded-3xl border p-8 ${
            called ? "animate-pulse border-red-700 bg-red-950/40 glow-red" : "border-zinc-800 bg-zinc-900/80"
          }`}
        >
          {called ? (
            <h2 className="text-xl font-semibold text-red-300">ถึงคิวคุณแล้ว เชิญที่บูธ</h2>
          ) : (
            <h2 className="font-semibold text-zinc-300">จองสำเร็จ — เลขคิวของคุณ</h2>
          )}
          <div className={`text-8xl font-extrabold tracking-[0.1em] ${called ? "text-glow text-red-100" : ""}`}>
            {b.queueLabel}
          </div>
          {b.status === "waiting" && (
            <div className="mt-2 flex gap-6 text-center font-light text-zinc-400">
              <p>คิวก่อนหน้า <b className="font-semibold text-zinc-100">{b.position ?? "-"}</b> คิว</p>
              <p>รอประมาณ <b className="font-semibold text-zinc-100">{b.etaMinutes ?? "-"}</b> นาที</p>
            </div>
          )}
          {b.paymentMethod === "cash" && b.paymentStatus === "unpaid" && (
            <p className="mt-2 rounded-xl border border-amber-900 bg-amber-950/50 px-3 py-2 text-sm text-amber-300">
              ชำระเงินสด {b.amountThb} บาท กับพนักงานตอนถึงคิว
            </p>
          )}
        </section>
      )}

      {b.status === "shooting" && <Big label={b.queueLabel} title="กำลังถ่ายรูป" sub="ขอให้สนุกกับการถ่ายรูป" />}
      {b.status === "done" && <Big label={b.queueLabel} title="เสร็จเรียบร้อย" sub="ขอบคุณที่ใช้บริการ AHLAN GROUP" />}
      {b.status === "no_show" && <Big label={b.queueLabel} title="เรียกคิวแล้วไม่พบ" sub="ติดต่อพนักงานเพื่อกลับเข้าคิว" />}
      {b.status === "cancelled" && <Big label={b.queueLabel} title="ยกเลิกแล้ว" sub="" />}

      <p className="mt-auto text-center text-[11px] font-light uppercase tracking-[0.3em] text-zinc-600">
        หน้านี้อัปเดตอัตโนมัติ · เก็บลิงก์ไว้เช็คคิว
      </p>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="bg-ahlan flex min-h-screen items-center justify-center px-5">{children}</main>;
}

function Big({ label, title, sub }: { label: string | null; title: string; sub: string }) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      {label && <div className="text-7xl font-extrabold tracking-[0.1em] text-zinc-200">{label}</div>}
      {sub && <p className="text-sm font-light text-zinc-400">{sub}</p>}
    </section>
  );
}
