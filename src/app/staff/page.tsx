"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SoundToggle } from "@/components/sound-toggle";
import { playNewBooking, playNewSlip } from "@/lib/sound";
import { useQueueUpdates } from "@/lib/use-queue-updates";
import type { StaffBooking, StaffQueueResponse } from "@/lib/types";

const STATUS_TH: Record<string, string> = {
  pending_payment: "รอชำระ",
  pending_verify: "รอตรวจสลิป",
  waiting: "รอคิว",
  called: "เรียกแล้ว",
  shooting: "กำลังถ่าย",
  done: "เสร็จแล้ว",
  no_show: "ไม่มา",
  cancelled: "ยกเลิก",
};

export default function StaffPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<StaffQueueResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const prevIdsRef = useRef<{ all: Set<string>; verify: Set<string> } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/queue", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) return;
    const d: StaffQueueResponse = await res.json();
    const all = new Set(d.active.map((b) => b.id));
    const verify = new Set(d.active.filter((b) => b.status === "pending_verify").map((b) => b.id));
    const prev = prevIdsRef.current;
    if (prev) {
      const hasNewSlip = [...verify].some((id) => !prev.verify.has(id));
      const hasNewBooking = [...all].some((id) => !prev.all.has(id));
      if (hasNewSlip) playNewSlip();
      else if (hasNewBooking) playNewBooking();
    }
    prevIdsRef.current = { all, verify };
    setAuthed(true);
    setData(d);
  }, []);

  useQueueUpdates(load, 5000);

  async function act(id: string, action: string) {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/staff/bookings/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error ?? "ทำรายการไม่สำเร็จ");
      }
    } finally {
      setBusyId(null);
      await load();
    }
  }

  if (authed === false) {
    return (
      <main className="bg-page flex min-h-screen items-center justify-center px-5">
        <div className="glass-strong flex flex-col items-center gap-4 rounded-3xl p-8">
          <p className="font-light text-neutral-500">ยังไม่ได้เข้าสู่ระบบ</p>
          <Link href="/app" className="press rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white glow-red-soft">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="bg-page flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-light text-neutral-400">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="bg-page min-h-screen">
      <header className="glass-bar sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 lg:max-w-5xl">
          <div className="flex items-center gap-3">
            <Link href="/app"><Logo imgClass="h-10 w-auto rounded-xl" textClass="text-base" /></Link>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">Staff</span>
            <SoundToggle className="!px-3 !py-1.5 !text-xs" />
          </div>
          <div className="text-right text-sm font-light text-neutral-500">
            <div>รอ <b className="font-semibold text-neutral-900">{data.stats.waiting}</b> · เสร็จ <b className="font-semibold text-neutral-900">{data.stats.doneToday}</b></div>
            <div>ยอดรับ <b className="font-semibold text-red-600">{data.stats.revenuePaidThb.toLocaleString()} บาท</b></div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-12 pt-5 lg:max-w-5xl">
        {actionError && (
          <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{actionError}</p>
        )}

        <section className="grid items-start gap-3 lg:grid-cols-2">
          {data.active.length === 0 && (
            <div className="glass col-span-full flex flex-col items-center gap-2 rounded-3xl py-12 text-center">
              <p className="font-medium text-neutral-500">ยังไม่มีคิววันนี้</p>
              <p className="text-sm font-light text-neutral-400">เมื่อลูกค้าจองเข้ามา การ์ดคิวจะขึ้นที่นี่อัตโนมัติ</p>
            </div>
          )}
          {data.active.map((b) => (
            <BookingCard key={b.id} b={b} busy={busyId === b.id} onAction={act} />
          ))}
        </section>

        {data.recent.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">ล่าสุด</h2>
            <div className="glass divide-y divide-neutral-100 overflow-hidden rounded-3xl">
              {data.recent.map((b) => (
                <div key={b.id} className="flex justify-between px-5 py-3 text-sm font-light text-neutral-500">
                  <span><b className="font-semibold text-neutral-700">{b.queueLabel ?? "—"}</b> · {b.name}</span>
                  <span>{STATUS_TH[b.status]}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function BookingCard({
  b,
  busy,
  onAction,
}: {
  b: StaffBooking;
  busy: boolean;
  onAction: (id: string, action: string) => void;
}) {
  const badge =
    b.status === "shooting" || b.status === "called"
      ? "bg-red-600 text-white"
      : b.status === "pending_verify"
        ? "bg-red-50 text-red-600"
        : b.status === "no_show"
          ? "bg-neutral-900 text-white"
          : "bg-neutral-100 text-neutral-500";

  return (
    <div className={`glass-strong rounded-3xl p-5 transition-opacity ${busy ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold tracking-wide text-neutral-900">{b.queueLabel ?? "—"}</span>
          <div className="text-sm">
            <div className="font-semibold text-neutral-900">{b.name}</div>
            <div className="font-light text-neutral-400">
              {b.partySize} คน · {b.photoCount} รูป · {b.amountThb.toLocaleString()} บาท
              {b.callCount > 1 && <span className="font-medium text-amber-600"> · เรียกแล้ว {b.callCount} ครั้ง</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{STATUS_TH[b.status]}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              b.paymentStatus === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {b.paymentStatus === "paid" ? "จ่ายแล้ว" : b.paymentMethod === "cash" ? "เงินสด-ยังไม่จ่าย" : "ยังไม่จ่าย"}
          </span>
        </div>
      </div>

      {b.status === "pending_verify" && b.slipUrl && (
        <a
          href={b.slipUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block overflow-hidden rounded-2xl border border-neutral-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.slipUrl} alt="สลิป" className="max-h-72 w-full bg-neutral-50 object-contain" />
          <span className="block bg-neutral-900 py-2 text-center text-xs font-medium text-white">
            แตะเพื่อดูรูปเต็ม — เช็คยอด {b.amountThb.toLocaleString()} บาท + เวลาโอน
          </span>
        </a>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {b.status === "pending_verify" && (
          <>
            <Btn kind="primary" onClick={() => onAction(b.id, "approve_slip")}>✓ สลิปถูกต้อง ออกคิว</Btn>
            <Btn kind="danger" onClick={() => onAction(b.id, "reject_slip")}>สลิปไม่ผ่าน</Btn>
          </>
        )}
        {b.status === "waiting" && <Btn kind="primary" onClick={() => onAction(b.id, "call")}>📢 เรียกคิว</Btn>}
        {b.status === "called" && (
          <>
            <Btn kind="primary" onClick={() => onAction(b.id, "start")}>📸 เริ่มถ่าย</Btn>
            <Btn kind="ghost" onClick={() => onAction(b.id, "recall")}>🔁 เรียกซ้ำ</Btn>
            <Btn kind="danger" onClick={() => onAction(b.id, "no_show")}>ไม่มา</Btn>
          </>
        )}
        {b.status === "shooting" && <Btn kind="black" onClick={() => onAction(b.id, "done")}>✓ เสร็จแล้ว</Btn>}
        {b.status === "no_show" && <Btn kind="primary" onClick={() => onAction(b.id, "requeue")}>↩ กลับเข้าคิว</Btn>}
        {b.paymentMethod === "cash" && b.paymentStatus === "unpaid" && b.status !== "cancelled" && (
          <Btn kind="black" onClick={() => onAction(b.id, "confirm_cash")}>💵 รับเงินแล้ว</Btn>
        )}
        {["pending_payment", "pending_verify", "waiting", "called"].includes(b.status) && (
          <Btn kind="ghost" onClick={() => onAction(b.id, "cancel")}>ยกเลิก</Btn>
        )}
      </div>
    </div>
  );
}

function Btn({
  kind,
  onClick,
  children,
}: {
  kind: "primary" | "black" | "danger" | "ghost";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    primary: "bg-red-600 text-white glow-red-soft",
    black: "bg-neutral-900 text-white",
    danger: "border border-red-200 bg-white text-red-600",
    ghost: "border border-neutral-200 bg-white text-neutral-500",
  };
  return (
    <button onClick={onClick} className={`press rounded-2xl px-5 py-3 text-sm font-semibold ${styles[kind]}`}>
      {children}
    </button>
  );
}
