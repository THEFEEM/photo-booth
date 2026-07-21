"use client";

import { useCallback, useState } from "react";
import { Logo } from "@/components/logo";
import { useQueueUpdates } from "@/lib/use-queue-updates";
import type { QueueState } from "@/lib/types";

/** จอแสดงคิว — responsive: มือถือ stack, จอใหญ่ตัวเลขใหญ่ตามจอ (clamp) */
export default function TvPage() {
  const [q, setQ] = useState<QueueState | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/queue", { cache: "no-store" });
    if (res.ok) setQ(await res.json());
  }, []);

  useQueueUpdates(load, 3000);

  return (
    <main className="bg-page min-h-screen w-full text-neutral-800">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6 md:max-w-3xl lg:max-w-none lg:px-[4vw] lg:py-[3vh]">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-[1.5vw]">
            <Logo imgClass="h-10 w-auto rounded-xl md:h-14 lg:h-[7vh]" textClass="text-xl text-neutral-900" />
            <span className="hidden text-sm font-light uppercase tracking-[0.5em] text-neutral-400 sm:block lg:text-[1.6vw]">
              Photo Booth
            </span>
          </div>
          <span className="text-sm font-light text-neutral-500 md:text-lg lg:text-[1.8vw]">
            รออีก <b className="font-semibold text-neutral-800">{q?.waitingCount ?? 0}</b> คิว
          </span>
        </header>

        <section className="mt-5 grid flex-1 gap-4 lg:mt-[2.5vh] lg:grid-cols-3 lg:gap-[2vw]">
          <div
            className={`flex min-h-[38vh] flex-col items-center justify-center rounded-3xl lg:col-span-2 lg:min-h-0 lg:rounded-[2.5vw] ${
              q?.called
                ? "animate-pulse bg-red-600 text-white glow-red-soft"
                : "glass-strong"
            }`}
          >
            {q?.called ? (
              <>
                <div className="text-lg font-semibold tracking-[0.3em] lg:text-[2.4vw]">เชิญคิว</div>
                <div className="font-extrabold leading-none tracking-[0.06em]" style={{ fontSize: "clamp(5rem, 18vw, 17rem)" }}>
                  {q.called}
                </div>
              </>
            ) : q?.shooting ? (
              <>
                <div className="text-base font-light tracking-[0.4em] text-neutral-400 lg:text-[2.2vw]">กำลังถ่าย</div>
                <div
                  className="font-extrabold leading-none tracking-[0.06em] text-neutral-900"
                  style={{ fontSize: "clamp(5rem, 18vw, 17rem)" }}
                >
                  {q.shooting}
                </div>
              </>
            ) : (
              <div className="text-xl font-light tracking-[0.4em] text-neutral-300 lg:text-[2.5vw]">พร้อมให้บริการ</div>
            )}
            {q?.called && q?.shooting && (
              <div className={`mt-3 text-sm font-light lg:text-[1.7vw] ${q.called ? "text-white/80" : "text-neutral-400"}`}>
                กำลังถ่าย <b className="font-semibold">{q.shooting}</b>
              </div>
            )}
          </div>

          <div className="glass-strong flex flex-col rounded-3xl p-5 lg:rounded-[2.5vw] lg:p-[1.8vw]">
            <h2 className="text-sm font-semibold tracking-[0.3em] text-neutral-500 lg:text-[1.7vw]">คิวถัดไป</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:mt-[1.5vh] lg:flex lg:flex-1 lg:flex-col lg:gap-[1.2vh]">
              {(q?.upNext ?? []).map((label, i) => (
                <div
                  key={label}
                  className={`rounded-2xl px-4 py-3 text-center text-3xl font-extrabold tracking-[0.08em] md:text-4xl lg:rounded-[1vw] lg:text-[4vw] ${
                    i === 0 ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {label}
                </div>
              ))}
              {(!q || q.upNext.length === 0) && (
                <div className="col-span-2 py-6 text-center text-sm font-light text-neutral-300 lg:text-[1.6vw]">
                  ยังไม่มีคิว
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-5 text-center text-xs font-light tracking-[0.3em] text-neutral-400 md:text-sm lg:mt-[2vh] lg:text-[1.4vw]">
          สแกน QR เพื่อจองคิว · 1 รูป 15 บาท <span className="text-red-300">·</span> AHLAN GROUP
        </footer>
      </div>
    </main>
  );
}
