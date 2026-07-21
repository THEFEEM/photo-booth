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
    <main className="bg-ahlan flex min-h-screen flex-col px-[4vw] py-[3vh]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-[1.5vw]">
          <Logo imgClass="h-[7vh] w-auto" textClass="text-[2.5vw]" />
          <span className="text-[1.6vw] font-light uppercase tracking-[0.5em] text-zinc-500">Photo Booth</span>
        </div>
        <span className="text-[1.8vw] font-light text-zinc-400">
          รออีก <b className="font-semibold text-zinc-100">{q?.waitingCount ?? 0}</b> คิว
        </span>
      </header>

      <section className="mt-[2.5vh] grid flex-1 grid-cols-3 gap-[2vw]">
        <div
          className={`col-span-2 flex flex-col items-center justify-center rounded-[2vw] border-t-[0.6vh] bg-zinc-900/80 ${
            q?.called ? "border-red-600 glow-red" : "border-red-800"
          }`}
        >
          {q?.called ? (
            <>
              <div className="text-[2.4vw] font-semibold tracking-[0.3em] text-red-400">เชิญคิว</div>
              <div className="text-glow animate-pulse text-[17vw] font-extrabold leading-none tracking-[0.08em] text-red-100">
                {q.called}
              </div>
            </>
          ) : q?.shooting ? (
            <>
              <div className="text-[2.2vw] font-light tracking-[0.4em] text-zinc-400">กำลังถ่าย</div>
              <div className="text-[17vw] font-extrabold leading-none tracking-[0.08em]">{q.shooting}</div>
            </>
          ) : (
            <div className="text-[2.5vw] font-light tracking-[0.4em] text-zinc-600">พร้อมให้บริการ</div>
          )}
          {q?.called && q?.shooting && (
            <div className="mt-[1.5vh] text-[1.7vw] font-light text-zinc-400">
              กำลังถ่าย <b className="font-semibold text-zinc-100">{q.shooting}</b>
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-[2vw] border border-zinc-800 bg-zinc-900/60 p-[1.8vw]">
          <h2 className="text-[1.7vw] font-semibold tracking-[0.3em] text-zinc-300">คิวถัดไป</h2>
          <div className="mt-[1.5vh] flex flex-1 flex-col gap-[1.2vh]">
            {(q?.upNext ?? []).map((label, i) => (
              <div
                key={label}
                className={`rounded-[1vw] border px-[1.5vw] py-[1.2vh] text-center text-[4vw] font-extrabold tracking-[0.1em] ${
                  i === 0
                    ? "border-red-700 bg-red-950/50 text-red-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400"
                }`}
              >
                {label}
              </div>
            ))}
            {(!q || q.upNext.length === 0) && (
              <div className="mt-[2vh] text-center text-[1.6vw] font-light text-zinc-600">ยังไม่มีคิว</div>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-[2vh] flex items-center justify-center gap-[2vw] text-[1.4vw] font-light tracking-[0.2em] text-zinc-500">
        สแกน QR เพื่อจองคิว · 1 รูป 15 บาท <span className="text-red-700">·</span> AHLAN GROUP
      </footer>
    </main>
  );
}
