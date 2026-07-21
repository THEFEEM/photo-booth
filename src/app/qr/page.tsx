"use client";

import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { useQueueUpdates } from "@/lib/use-queue-updates";
import type { QueueState } from "@/lib/types";

/** จอตั้งหน้าบูธ: QR สแกนจอง + คิวปัจจุบัน (ธีมลูกค้า minimal) */
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
    <main className="bg-cream flex min-h-screen flex-col px-[4vw] py-[4vh] text-stone-800">
      <header className="flex flex-col items-center gap-[1vh] text-center">
        <Logo imgClass="h-[9vh] w-auto rounded-2xl" textClass="text-[3vw] text-stone-900" />
        <p className="text-[1.6vw] font-light uppercase tracking-[0.5em] text-stone-400">Photo Booth</p>
      </header>

      <section className="mt-[3vh] grid flex-1 grid-cols-5 gap-[2.5vw]">
        <div className="card-cream col-span-3 flex flex-col items-center justify-center gap-[2vh] rounded-[2.5vw] p-[2.5vw]">
          <h2 className="text-[2.4vw] font-semibold">สแกนเพื่อจองคิว</h2>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR จองคิว" className="w-[26vw] rounded-[1.5vw] border border-stone-100" />
          ) : (
            <div className="flex h-[26vw] w-[26vw] items-center justify-center rounded-[1.5vw] bg-stone-100 text-[1.5vw] font-light text-stone-400">
              กำลังโหลด QR...
            </div>
          )}
          <p className="text-[1.6vw] font-light text-stone-500">
            1 รูป <b className="font-semibold text-rose-400">15.-</b> · 2 รูป <b className="font-semibold text-rose-400">30.-</b> · 3 รูป <b className="font-semibold text-rose-400">45.-</b>
          </p>
        </div>

        <div className="col-span-2 flex flex-col gap-[2vh]">
          <div
            className={`flex flex-1 flex-col items-center justify-center rounded-[2.5vw] p-[1.5vw] ${
              q?.called
                ? "animate-pulse bg-rose-400 text-white shadow-[0_18px_44px_-12px_rgba(244,114,142,0.8)]"
                : "card-cream"
            }`}
          >
            {q?.called ? (
              <>
                <div className="text-[1.8vw] font-semibold tracking-[0.3em]">เชิญคิว</div>
                <div className="text-[9vw] font-extrabold leading-none tracking-[0.06em]">{q.called}</div>
              </>
            ) : q?.shooting ? (
              <>
                <div className="text-[1.6vw] font-light tracking-[0.4em] text-stone-400">กำลังถ่าย</div>
                <div className="text-[9vw] font-extrabold leading-none tracking-[0.06em] text-stone-900">{q.shooting}</div>
              </>
            ) : (
              <div className="text-[1.8vw] font-light tracking-[0.3em] text-stone-300">พร้อมให้บริการ</div>
            )}
          </div>

          <div className="card-cream rounded-[2.5vw] p-[1.5vw]">
            <h3 className="text-[1.4vw] font-semibold tracking-[0.3em] text-stone-500">คิวถัดไป</h3>
            <div className="mt-[1vh] flex flex-wrap gap-[0.8vw]">
              {(q?.upNext ?? []).slice(0, 4).map((label, i) => (
                <span
                  key={label}
                  className={`rounded-full px-[1.4vw] py-[0.8vh] text-[1.8vw] font-bold tracking-[0.08em] ${
                    i === 0 ? "bg-rose-50 text-rose-400" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {label}
                </span>
              ))}
              {(!q || q.upNext.length === 0) && (
                <span className="text-[1.4vw] font-light text-stone-300">ยังไม่มีคิว</span>
              )}
              {q && q.waitingCount > 4 && (
                <span className="rounded-full bg-stone-100 px-[1.4vw] py-[0.8vh] text-[1.8vw] font-light text-stone-400">
                  +{q.waitingCount - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-[2.5vh] text-center text-[1.3vw] font-light uppercase tracking-[0.4em] text-stone-300">
        AHLAN GROUP
      </footer>
    </main>
  );
}
