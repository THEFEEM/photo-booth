"use client";

import { useCallback, useState } from "react";
import { Logo } from "@/components/logo";
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
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [data, setData] = useState<StaffQueueResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/queue", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (res.ok) {
      setAuthed(true);
      setData(await res.json());
    }
  }, []);

  useQueueUpdates(load, 5000);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      setLoginError("PIN ไม่ถูกต้อง");
      return;
    }
    setPin("");
    await load();
  }

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
      <main className="bg-ahlan flex min-h-screen items-center justify-center px-5">
        <form onSubmit={login} className="flex w-full max-w-xs flex-col items-center gap-5">
          <Logo imgClass="h-14 w-auto" textClass="text-xl" />
          <p className="text-sm font-light tracking-[0.3em] text-zinc-500">STAFF CONSOLE</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-center text-2xl tracking-[0.5em] outline-none transition-colors placeholder:tracking-normal placeholder:text-zinc-600 focus:border-red-600"
          />
          {loginError && <p className="text-sm text-red-400">{loginError}</p>}
          <button className="w-full rounded-2xl bg-red-600 py-3.5 font-semibold text-white transition-colors active:bg-red-700">
            เข้าสู่ระบบ
          </button>
        </form>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="bg-ahlan flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-light text-zinc-600">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="bg-ahlan min-h-screen">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo imgClass="h-10 w-auto" textClass="text-base" />
            <span className="text-xs font-light tracking-[0.3em] text-zinc-500">STAFF</span>
          </div>
          <div className="text-right text-sm font-light text-zinc-400">
            <div>รอ <b className="font-semibold text-zinc-100">{data.stats.waiting}</b> · เสร็จ <b className="font-semibold text-zinc-100">{data.stats.doneToday}</b></div>
            <div>ยอดรับ <b className="font-semibold text-red-400">{data.stats.revenuePaidThb.toLocaleString()} บาท</b></div>
          </div>
        </header>

        {actionError && (
          <p className="mb-3 rounded-xl border border-red-900 bg-red-950/60 px-3 py-2.5 text-sm text-red-300">{actionError}</p>
        )}

        <section className="flex flex-col gap-3">
          {data.active.length === 0 && (
            <p className="py-10 text-center font-light text-zinc-600">ยังไม่มีคิววันนี้</p>
          )}
          {data.active.map((b) => (
            <BookingCard key={b.id} b={b} busy={busyId === b.id} onAction={act} />
          ))}
        </section>

        {data.recent.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-xs font-semibold tracking-[0.3em] text-zinc-600">ล่าสุด</h2>
            <div className="flex flex-col gap-1">
              {data.recent.map((b) => (
                <div key={b.id} className="flex justify-between rounded-xl bg-zinc-900/50 px-3 py-2 text-sm font-light text-zinc-500">
                  <span>{b.queueLabel ?? "—"} · {b.name}</span>
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
    b.status === "shooting"
      ? "border-zinc-600 bg-zinc-800 text-zinc-200"
      : b.status === "called"
        ? "border-red-700 bg-red-950/60 text-red-300"
        : b.status === "pending_verify"
          ? "border-red-800 bg-red-950/40 text-red-400"
          : b.status === "no_show"
            ? "border-red-900 bg-zinc-900 text-red-500"
            : "border-zinc-700 bg-zinc-800/80 text-zinc-400";

  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 ${busy ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold tracking-wider">{b.queueLabel ?? "—"}</span>
          <div className="text-sm">
            <div className="font-medium">{b.name}</div>
            <div className="font-light text-zinc-400">
              {b.partySize} คน · {b.photoCount} รูป · {b.amountThb} บาท
              {b.callCount > 1 && <span className="text-amber-400"> · เรียกแล้ว {b.callCount} ครั้ง</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge}`}>{STATUS_TH[b.status]}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              b.paymentStatus === "paid" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
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
          className="mt-3 block overflow-hidden rounded-xl border border-zinc-700"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.slipUrl} alt="สลิป" className="max-h-72 w-full bg-zinc-950 object-contain" />
          <span className="block bg-zinc-800 py-1.5 text-center text-xs font-light text-zinc-300">
            แตะเพื่อดูรูปเต็ม — เช็คยอด {b.amountThb} บาท + เวลาโอน
          </span>
        </a>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {b.status === "pending_verify" && (
          <>
            <Btn kind="primary" onClick={() => onAction(b.id, "approve_slip")}>สลิปถูกต้อง ออกคิว</Btn>
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
        {b.status === "shooting" && <Btn kind="primary" onClick={() => onAction(b.id, "done")}>✔️ เสร็จแล้ว</Btn>}
        {b.status === "no_show" && <Btn kind="primary" onClick={() => onAction(b.id, "requeue")}>กลับเข้าคิว</Btn>}
        {b.paymentMethod === "cash" && b.paymentStatus === "unpaid" && b.status !== "cancelled" && (
          <Btn kind="amber" onClick={() => onAction(b.id, "confirm_cash")}>💵 รับเงินแล้ว</Btn>
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
  kind: "primary" | "danger" | "amber" | "ghost";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    primary: "bg-red-600 text-white active:bg-red-700",
    danger: "border border-red-900 bg-transparent text-red-400 active:bg-red-950",
    amber: "bg-amber-600 text-white active:bg-amber-700",
    ghost: "border border-zinc-700 bg-transparent text-zinc-300 active:bg-zinc-800",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${styles[kind]}`}
    >
      {children}
    </button>
  );
}
