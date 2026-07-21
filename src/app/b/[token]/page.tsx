"use client";

import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { SoundToggle } from "@/components/sound-toggle";
import { Steps } from "@/components/steps";
import { playCalled, playNear, playSuccess } from "@/lib/sound";
import { useQueueUpdates } from "@/lib/use-queue-updates";
import type { BookingStatusResponse } from "@/lib/types";

function stepState(b: BookingStatusResponse): { labels: string[]; current: number } {
  if (b.paymentMethod === "cash") {
    const labels = ["จองคิว", "รับเลขคิว", "จ่ายหน้าบูธ", "ถ่ายรูป"];
    if (b.status === "done") return { labels, current: 4 };
    if (b.status === "shooting") return { labels, current: 3 };
    if (b.paymentStatus === "paid") return { labels, current: 3 };
    if (b.queueLabel) return { labels, current: 2 };
    return { labels, current: 1 };
  }
  const labels = ["จองคิว", "ชำระเงิน", "ตรวจสลิป", "รับเลขคิว"];
  if (b.status === "pending_payment") return { labels, current: 1 };
  if (b.status === "pending_verify") return { labels, current: 2 };
  if (b.status === "done" || b.status === "shooting") return { labels, current: 4 };
  return { labels, current: 3 };
}

export default function BookingStatusPage() {
  const { token } = useParams<{ token: string }>();
  const [b, setB] = useState<BookingStatusResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const prevRef = useRef<{ status: string; callCount: number; position: number | null } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/bookings/${token}`, { cache: "no-store" });
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    if (!res.ok) return;
    const data: BookingStatusResponse = await res.json();
    const prev = prevRef.current;
    if (prev) {
      if (data.status === "called" && (prev.status !== "called" || data.callCount > prev.callCount)) {
        playCalled();
      } else if (prev.status === "pending_verify" && data.status === "waiting") {
        playSuccess();
      } else if (
        data.status === "waiting" &&
        data.position != null &&
        data.position <= 2 &&
        (prev.position == null || prev.position > 2)
      ) {
        playNear();
      }
    }
    prevRef.current = { status: data.status, callCount: data.callCount, position: data.position };
    setB(data);
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
    return <Center><p className="font-light text-neutral-400">ไม่พบการจองนี้</p></Center>;
  }
  if (!b) {
    return <Center><p className="animate-pulse font-light text-neutral-400">กำลังโหลด...</p></Center>;
  }

  const called = b.status === "called";
  const steps = stepState(b);

  return (
    <main className="bg-page min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pb-10 pt-10 sm:max-w-lg lg:pt-14">
        <header className="flex flex-col items-center gap-2 text-center">
          <Logo imgClass="h-12 w-auto rounded-2xl shadow-md" textClass="text-xl" />
          <p className="text-sm font-light text-neutral-500">
            {b.name} · {b.partySize} คน · {b.photoCount} รูป · {b.amountThb.toLocaleString()} บาท
          </p>
        </header>

        <div className="glass rounded-3xl p-4">
          <Steps labels={steps.labels} current={steps.current} />
        </div>

        {["pending_payment", "pending_verify", "waiting", "called"].includes(b.status) && (
          <div className="flex justify-center">
            <SoundToggle />
          </div>
        )}

        {b.status === "pending_payment" && (
          <section className="glass-strong flex flex-col items-center gap-4 rounded-3xl p-6">
            {b.slipRejected && (
              <p className="w-full rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                สลิปไม่ผ่านการตรวจสอบ — เช็คยอดโอนแล้วอัปโหลดใหม่ หรือติดต่อพนักงาน
              </p>
            )}
            <div className="text-center">
              <h2 className="text-lg font-semibold">สแกนจ่าย <span className="text-red-600">{b.amountThb.toLocaleString()} บาท</span></h2>
              <p className="mt-0.5 text-xs font-light text-neutral-400">ยอดเงินถูกฝังใน QR แล้ว ไม่ต้องพิมพ์เอง</p>
            </div>
            {b.promptpayQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.promptpayQr} alt="PromptPay QR" className="w-64 rounded-2xl border border-neutral-100 shadow-sm" />
            ) : (
              <p className="text-sm text-amber-600">ยังไม่ได้ตั้งค่า PromptPay — สอบถามพนักงาน</p>
            )}
            <form onSubmit={uploadSlip} className="flex w-full flex-col gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="w-full rounded-2xl border border-neutral-200 bg-white p-3 text-sm font-light text-neutral-600 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-4 file:py-2.5 file:font-medium file:text-white"
              />
              {slipError && <p className="text-center text-sm font-medium text-red-600">{slipError}</p>}
              <button
                disabled={uploading}
                className="press rounded-2xl bg-red-600 py-4 text-lg font-semibold text-white glow-red-soft disabled:opacity-50"
              >
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลดสลิป"}
              </button>
            </form>
            <div className="w-full rounded-2xl bg-neutral-50 px-4 py-3 text-xs font-light leading-relaxed text-neutral-500">
              <b className="font-medium text-neutral-700">ขั้นตอน:</b> ① สแกน QR ด้วยแอปธนาคาร โอนตามยอด → ② บันทึกสลิปแล้วกดอัปโหลด → ③ พนักงานตรวจ ไม่เกิน 1–2 นาที เลขคิวจะขึ้นหน้านี้อัตโนมัติ
            </div>
          </section>
        )}

        {b.status === "pending_verify" && (
          <section className="glass-strong flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
            </div>
            <h2 className="text-lg font-semibold">ส่งสลิปแล้ว รอพนักงานตรวจสอบ</h2>
            <p className="text-sm font-light text-neutral-400">
              โดยปกติไม่เกิน 1–2 นาที — เลขคิวจะขึ้นหน้านี้อัตโนมัติ ไม่ต้องรีเฟรช
            </p>
          </section>
        )}

        {(b.status === "waiting" || called) && b.queueLabel && (
          <section
            className={`flex flex-col items-center gap-2 rounded-3xl p-8 transition-all duration-500 ${
              called ? "animate-pulse bg-red-600 text-white glow-red-soft" : "glass-strong"
            }`}
          >
            {called ? (
              <h2 className="text-xl font-semibold">ถึงคิวคุณแล้ว เชิญที่บูธ</h2>
            ) : (
              <h2 className="font-medium text-neutral-500">เลขคิวของคุณ</h2>
            )}
            <div className={`text-8xl font-extrabold tracking-[0.06em] ${called ? "text-white" : "text-neutral-900"}`}>
              {b.queueLabel}
            </div>
            {b.status === "waiting" && b.position != null && b.position <= 2 && (
              <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                🔔 เตรียมตัว — ใกล้ถึงคิวคุณแล้ว
              </p>
            )}
            {b.status === "waiting" && (
              <div className="mt-2 flex gap-6 text-center font-light text-neutral-500">
                <p>คิวก่อนหน้า <b className="font-semibold text-neutral-900">{b.position ?? "-"}</b> คิว</p>
                <p>รอประมาณ <b className="font-semibold text-neutral-900">{b.etaMinutes ?? "-"}</b> นาที</p>
              </div>
            )}
            {b.paymentMethod === "cash" && b.paymentStatus === "unpaid" && (
              <p className={`mt-2 rounded-2xl px-4 py-2.5 text-sm font-medium ${called ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"}`}>
                เตรียมเงินสด {b.amountThb.toLocaleString()} บาท ชำระกับพนักงานตอนถึงคิว
              </p>
            )}
          </section>
        )}

        {b.status === "shooting" && <Big label={b.queueLabel} title="กำลังถ่ายรูป" sub="ขอให้สนุกกับการถ่ายรูป" />}
        {b.status === "done" && <Big label={b.queueLabel} title="เสร็จเรียบร้อย" sub="ขอบคุณที่ใช้บริการ AHLAN GROUP" />}
        {b.status === "no_show" && <Big label={b.queueLabel} title="เรียกคิวแล้วไม่พบ" sub="ติดต่อพนักงานเพื่อกลับเข้าคิว" />}
        {b.status === "cancelled" && <Big label={b.queueLabel} title="ยกเลิกแล้ว" sub="" />}

        <p className="mt-auto text-center text-[11px] font-light uppercase tracking-[0.3em] text-neutral-400">
          หน้านี้อัปเดตอัตโนมัติ · เก็บลิงก์ไว้เช็คคิว
        </p>
      </div>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="bg-page flex min-h-screen items-center justify-center px-5">{children}</main>;
}

function Big({ label, title, sub }: { label: string | null; title: string; sub: string }) {
  return (
    <section className="glass-strong flex flex-col items-center gap-2 rounded-3xl p-8">
      <h2 className="text-xl font-semibold text-neutral-700">{title}</h2>
      {label && <div className="text-7xl font-extrabold tracking-[0.06em] text-neutral-900">{label}</div>}
      {sub && <p className="text-sm font-light text-neutral-400">{sub}</p>}
    </section>
  );
}
