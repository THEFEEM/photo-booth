"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  Image as ImageIcon,
  QrCode,
  TrendingUp,
  Users,
  UserX,
} from "lucide-react";

interface Stats {
  date: string;
  totals: {
    total: number;
    done: number;
    noShow: number;
    cancelled: number;
    active: number;
    pending: number;
    revenue: number;
    revenuePromptpay: number;
    revenueCash: number;
    photos: number;
    guests: number;
    avgSessionMin: number | null;
  };
  hourly: { h: number; n: number }[];
  bookings: {
    queueLabel: string | null;
    name: string;
    partySize: number;
    photoCount: number;
    amountThb: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    createdTime: string;
  }[];
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  done: { label: "เสร็จแล้ว", cls: "bg-green-50 text-green-600" },
  shooting: { label: "กำลังถ่าย", cls: "bg-red-50 text-red-600" },
  called: { label: "เรียกแล้ว", cls: "bg-red-50 text-red-600" },
  waiting: { label: "รอคิว", cls: "bg-slate-100 text-slate-600" },
  pending_verify: { label: "รอตรวจสลิป", cls: "bg-amber-50 text-amber-600" },
  pending_payment: { label: "รอชำระ", cls: "bg-amber-50 text-amber-600" },
  no_show: { label: "ไม่มา", cls: "bg-red-50 text-red-500" },
  cancelled: { label: "ยกเลิก", cls: "bg-slate-100 text-slate-400" },
};

function todayBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

export default function DashboardPage() {
  const [date, setDate] = useState(todayBangkok());
  const [data, setData] = useState<Stats | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/staff/stats?date=${date}`, { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (res.ok) {
      setAuthed(true);
      setData(await res.json());
    }
  }, [date]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  if (authed === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page font-[Inter,Kanit,sans-serif]">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-slate-500">ยังไม่ได้เข้าสู่ระบบ</p>
          <Link href="/app" className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </main>
    );
  }

  const t = data?.totals;
  const maxHour = Math.max(1, ...(data?.hourly ?? []).map((x) => x.n));
  const revTotal = Math.max(1, t?.revenue ?? 0);
  const noShowRate = t && t.done + t.noShow > 0 ? Math.round((t.noShow / (t.done + t.noShow)) * 100) : 0;

  return (
    <main className="min-h-screen bg-page pb-12 font-[Inter,Kanit,sans-serif] text-slate-800">
      <header className="sticky top-0 z-10 border-b glass-bar border-transparent">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link href="/app" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">แดชบอร์ด</h1>
              <p className="text-xs text-slate-400">AHLAN GROUP · Photo Booth</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
              <CalendarDays size={15} className="text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-slate-700 outline-none"
              />
            </label>
            <a
              href={`/api/staff/export?date=${date}`}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-700"
            >
              <Download size={15} /> CSV
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        {!data ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi icon={<TrendingUp size={17} />} tint="bg-red-50 text-red-600" label="รายได้วันนี้" value={`${t!.revenue.toLocaleString()}`} unit="บาท" />
              <Kpi icon={<CheckCircle2 size={17} />} tint="bg-green-50 text-green-600" label="คิวเสร็จแล้ว" value={String(t!.done)} unit={`จาก ${t!.total} คิว`} />
              <Kpi icon={<Users size={17} />} tint="bg-violet-50 text-violet-600" label="ลูกค้า (คิวที่เสร็จ)" value={String(t!.guests)} unit={`คน · ${t!.photos} รูป`} />
              <Kpi icon={<Clock size={17} />} tint="bg-amber-50 text-amber-600" label="เฉลี่ยต่อคิว" value={t!.avgSessionMin != null ? String(t!.avgSessionMin) : "—"} unit="นาที" />
            </section>

            <section className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm md:col-span-2">
                <h2 className="text-sm font-semibold text-slate-500">จำนวนจองรายชั่วโมง</h2>
                {data.hourly.length === 0 ? (
                  <EmptyMini />
                ) : (
                  <div className="mt-4 flex h-36 items-end gap-1.5">
                    {Array.from({ length: 24 }, (_, h) => {
                      const n = data.hourly.find((x) => x.h === h)?.n ?? 0;
                      if (h < 8 && n === 0) return null;
                      return (
                        <div key={h} className="group flex flex-1 flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold text-red-600 opacity-0 transition-opacity group-hover:opacity-100">
                            {n || ""}
                          </span>
                          <div
                            className={`w-full rounded-md transition-colors ${n > 0 ? "bg-red-500 group-hover:bg-red-600" : "bg-slate-100"}`}
                            style={{ height: `${Math.max(4, (n / maxHour) * 100)}%` }}
                          />
                          <span className="text-[10px] text-slate-400">{h}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-500">ช่องทางรับเงิน</h2>
                  <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="bg-red-500" style={{ width: `${(t!.revenuePromptpay / revTotal) * 100}%` }} />
                    <div className="bg-green-500" style={{ width: `${(t!.revenueCash / revTotal) * 100}%` }} />
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500"><QrCode size={14} className="text-red-500" /> PromptPay</span>
                      <b>{t!.revenuePromptpay.toLocaleString()}.-</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500"><Banknote size={14} className="text-green-500" /> เงินสด</span>
                      <b>{t!.revenueCash.toLocaleString()}.-</b>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-500">คุณภาพคิว</h2>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500"><UserX size={14} className="text-red-400" /> No-show</span>
                      <b className={noShowRate > 15 ? "text-red-500" : ""}>{t!.noShow} คิว ({noShowRate}%)</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ยกเลิก</span>
                      <b>{t!.cancelled} คิว</b>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">กำลังรอ/ถ่ายอยู่</span>
                      <b className="text-red-600">{t!.active} คิว</b>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-3 rounded-2xl border border-slate-200/70 bg-white shadow-sm">
              <div className="flex items-center justify-between px-5 pt-4">
                <h2 className="text-sm font-semibold text-slate-500">รายการจองทั้งหมด</h2>
                <span className="text-xs text-slate-400">{data.bookings.length} รายการล่าสุด</span>
              </div>
              {data.bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                    <Camera size={26} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600">ยังไม่มีการจองวันนี้</p>
                    <p className="mt-0.5 text-sm text-slate-400">เมื่อลูกค้าสแกน QR จองคิว รายการจะขึ้นที่นี่</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 divide-y divide-slate-100">
                  {data.bookings.map((b, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-12 shrink-0 font-bold tracking-wide text-slate-700">{b.queueLabel ?? "—"}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{b.name}</p>
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <Users size={11} /> {b.partySize} · <ImageIcon size={11} /> {b.photoCount} · {b.createdTime} น.
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold">{b.amountThb}.-</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_META[b.status]?.cls ?? "bg-slate-100 text-slate-500"}`}>
                          {STATUS_META[b.status]?.label ?? b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Kpi({ icon, tint, label, value, unit }: { icon: React.ReactNode; tint: string; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className={`mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>{icon}</div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold tracking-tight">
        {value} <span className="text-xs font-normal text-slate-400">{unit}</span>
      </p>
    </div>
  );
}

function EmptyMini() {
  return <p className="mt-6 pb-4 text-center text-sm text-slate-300">ยังไม่มีข้อมูล</p>;
}
