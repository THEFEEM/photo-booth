"use client";

import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { useQueueUpdates } from "@/lib/use-queue-updates";
import type { QueueState } from "@/lib/types";

/** จอตั้งหน้าบูธ: QR สแกนจอง + คิวปัจจุบัน — responsive มือถือ/iPad/Notebook */
export default function QrDisplayPage() {
  const [q, setQ] = useState<QueueState | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/qr", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => body && setQr(body.qr))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/queue", { cache: "no-store" });
    if (res.ok) setQ(await res.json());
  }, []);

  useQueueUpdates(load, 4000);

  return (
    <main className="bg-page min-h-screen w-full text-neutral-800">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8 md:max-w-3xl lg:max-w-6xl lg:px-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <Logo imgClass="h-14 w-auto rounded-2xl md:h-20" textClass="text-2xl text-neutral-900" />
          <p className="text-sm font-light uppercase tracking-[0.5em] text-neutral-400 md:text-lg">Photo Booth</p>
        </header>

        <section className="mt-6 grid flex-1 gap-4 md:mt-8 md:gap-6 lg:grid-cols-5">
          <div className="glass-strong flex flex-col items-center justify-center gap-4 rounded-3xl p-6 md:p-8 lg:col-span-3">
            <h2 className="text-xl font-semibold md:text-3xl">สแกนเพื่อจองคิว</h2>
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="QR จองคิว"
                className="w-full max-w-[16rem] rounded-2xl border border-neutral-100 md:max-w-[22rem] lg:max-w-[26rem]"
              />
            ) : (
              <div className="flex aspect-square w-full max-w-[16rem] items-center justify-center rounded-2xl bg-neutral-100 text-sm font-light text-neutral-400 md:max-w-[22rem]">
                กำลังโหลด QR...
              </div>
            )}
            <p className="text-sm font-light text-neutral-500 md:text-xl">
              1 รูป <b className="font-semibold text-red-600">15.-</b> · 2 รูป <b className="font-semibold text-red-600">30.-</b> · 3 รูป <b className="font-semibold text-red-600">45.-</b>
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2">
            <div
              className={`flex flex-1 flex-col items-center justify-center rounded-3xl p-6 ${
                q?.called
                  ? "animate-pulse bg-red-600 text-white glow-red-soft"
                  : "glass-strong"
              }`}
            >
              {q?.called ? (
                <>
                  <div className="text-sm font-semibold tracking-[0.3em] md:text-xl">เชิญคิว</div>
                  <div className="text-7xl font-extrabold leading-none tracking-[0.06em] md:text-[8rem]">{q.called}</div>
                </>
              ) : q?.shooting ? (
                <>
                  <div className="text-sm font-light tracking-[0.4em] text-neutral-400 md:text-lg">กำลังถ่าย</div>
                  <div className="text-7xl font-extrabold leading-none tracking-[0.06em] text-neutral-900 md:text-[8rem]">
                    {q.shooting}
                  </div>
                </>
              ) : (
                <div className="py-6 text-lg font-light tracking-[0.3em] text-neutral-300 md:text-2xl">พร้อมให้บริการ</div>
              )}
            </div>

            <div className="glass-strong rounded-3xl p-5 md:p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold tracking-[0.3em] text-neutral-500">คิวถัดไป</h3>
                <span className="text-xs font-light text-neutral-400">รออีก {q?.waitingCount ?? 0} คิว</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(q?.upNext ?? []).slice(0, 4).map((label, i) => (
                  <span
                    key={label}
                    className={`rounded-full px-4 py-1.5 text-lg font-bold tracking-[0.08em] md:text-2xl ${
                      i === 0 ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {label}
                  </span>
                ))}
                {(!q || q.upNext.length === 0) && (
                  <span className="text-sm font-light text-neutral-300">ยังไม่มีคิว</span>
                )}
                {q && q.waitingCount > 4 && (
                  <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-lg font-light text-neutral-400 md:text-2xl">
                    +{q.waitingCount - 4}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-6 text-center text-[11px] font-light uppercase tracking-[0.4em] text-neutral-300 md:text-sm">
          AHLAN GROUP
        </footer>
      </div>
    </main>
  );
}
