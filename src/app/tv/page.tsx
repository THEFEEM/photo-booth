"use client";

import { useCallback, useState } from "react";
import { Logo } from "@/components/logo";
import { useQueueUpdates } from "@/lib/use-queue-updates";
import type { QueueState } from "@/lib/types";

export default function TvPage() {
  const [q, setQ] = useState<QueueState | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/queue", { cache: "no-store" });
    if (res.ok) setQ(await res.json());
  }, []);

  useQueueUpdates(load, 3000);

  return (
    <main className="bg-cream flex min-h-screen flex-col px-[4vw] py-[3vh] text-stone-800">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-[1.5vw]">
          <Logo imgClass="h-[7vh] w-auto rounded-xl" textClass="text-[2.5vw] text-stone-900" />
          <span className="text-[1.6vw] font-light uppercase tracking-[0.5em] text-stone-400">Photo Booth</span>
        </div>
        <span className="text-[1.8vw] font-light text-stone-500">
          รออีก <b className="font-semibold text-stone-800">{q?.waitingCount ?? 0}</b> คิว
        </span>
      </header>

      <section className="mt-[2.5vh] grid flex-1 grid-cols-3 gap-[2vw]">
        <div
          className={`col-span-2 flex flex-col items-center justify-center rounded-[2.5vw] ${
            q?.called
              ? "animate-pulse bg-rose-400 text-white shadow-[0_24px_60px_-16px_rgba(244,114,142,0.8)]"
              : "card-cream"
          }`}
        >
          {q?.called ? (
            <>
              <div className="text-[2.4vw] font-semibold tracking-[0.3em]">เชิญคิว</div>
              <div className="text-[17vw] font-extrabold leading-none tracking-[0.06em]">{q.called}</div>
            </>
          ) : q?.shooting ? (
            <>
              <div className="text-[2.2vw] font-light tracking-[0.4em] text-stone-400">กำลังถ่าย</div>
              <div className="text-[17vw] font-extrabold leading-none tracking-[0.06em] text-stone-900">{q.shooting}</div>
            </>
          ) : (
            <div className="text-[2.5vw] font-light tracking-[0.4em] text-stone-300">พร้อมให้บริการ</div>
          )}
          {q?.called && q?.shooting && (
            <div className={`mt-[1.5vh] text-[1.7vw] font-light ${q.called ? "text-white/80" : "text-stone-400"}`}>
              กำลังถ่าย <b className="font-semibold">{q.shooting}</b>
            </div>
          )}
        </div>

        <div className="card-cream flex flex-col rounded-[2.5vw] p-[1.8vw]">
          <h2 className="text-[1.7vw] font-semibold tracking-[0.3em] text-stone-500">คิวถัดไป</h2>
          <div className="mt-[1.5vh] flex flex-1 flex-col gap-[1.2vh]">
            {(q?.upNext ?? []).map((label, i) => (
              <div
                key={label}
                className={`rounded-[1vw] px-[1.5vw] py-[1.2vh] text-center text-[4vw] font-extrabold tracking-[0.08em] ${
                  i === 0 ? "bg-rose-50 text-rose-400" : "bg-stone-100 text-stone-400"
                }`}
              >
                {label}
              </div>
            ))}
            {(!q || q.upNext.length === 0) && (
              <div className="mt-[2vh] text-center text-[1.6vw] font-light text-stone-300">ยังไม่มีคิว</div>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-[2vh] text-center text-[1.4vw] font-light tracking-[0.3em] text-stone-400">
        สแกน QR เพื่อจองคิว · 1 รูป 15 บาท <span className="text-rose-300">·</span> AHLAN GROUP
      </footer>
    </main>
  );
}
