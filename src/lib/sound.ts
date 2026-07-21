"use client";

/** ระบบเสียงแจ้งเตือน — ไม่ใช้ไฟล์เสียง: Web Audio สร้างโทน + Web Speech พูดไทย
 *  เบราว์เซอร์ต้องมี user gesture ก่อน จึงมี unlock() ผูกกับปุ่มเปิดเสียง */

const KEY = "ahlan_sound_enabled";
let ctx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function setSoundEnabled(on: boolean): void {
  window.localStorage.setItem(KEY, on ? "1" : "0");
  if (on) unlock();
}

export function unlock(): void {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u); // ปลดล็อก TTS ด้วย gesture เดียวกัน
    }
  } catch {
    /* ignore */
  }
}

function ensure(): boolean {
  if (!isSoundEnabled()) return false;
  unlock();
  return ctx != null;
}

function tone(freq: number, startMs: number, durMs: number, volume = 0.25, type: OscillatorType = "sine"): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + startMs / 1000;
  const t1 = t0 + durMs / 1000;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t1 + 0.05);
}

/** ติ๊ง — สำเร็จ (สลิปผ่าน / ได้เลขคิว) */
export function playSuccess(): void {
  if (!ensure()) return;
  tone(880, 0, 150);
  tone(1318, 140, 280);
}

/** ปิ๊ง — ใกล้ถึงคิว */
export function playNear(): void {
  if (!ensure()) return;
  tone(988, 0, 220, 0.22);
  tone(988, 320, 220, 0.22);
}

/** เรียกคิวฝั่งลูกค้า — ดัง 3 รอบ + สั่นเครื่อง */
export function playCalled(): void {
  if (!ensure()) return;
  for (let r = 0; r < 3; r++) {
    const base = r * 1300;
    tone(1046, base, 180, 0.32);
    tone(1318, base + 190, 180, 0.32);
    tone(1568, base + 380, 320, 0.32);
  }
  try {
    navigator.vibrate?.([400, 150, 400, 150, 700]);
  } catch {
    /* ignore */
  }
}

/** ป๊อก — จองใหม่เข้า (staff) */
export function playNewBooking(): void {
  if (!ensure()) return;
  tone(660, 0, 130, 0.2, "triangle");
}

/** บี๊บคู่เด่น — สลิปใหม่รอตรวจ (staff) */
export function playNewSlip(): void {
  if (!ensure()) return;
  tone(1046, 0, 170, 0.3);
  tone(1046, 240, 170, 0.3);
  tone(1318, 480, 260, 0.3);
}

const TH_DIGITS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];

function spellLabel(label: string): string {
  return label
    .split("")
    .map((c) => (/[0-9]/.test(c) ? TH_DIGITS[Number(c)] : c === "A" ? "เอ" : c))
    .join(" ");
}

/** จอ TV/QR: chime + เสียงพูดไทยประกาศเลขคิว */
export function announceQueue(label: string): void {
  if (!ensure()) return;
  tone(784, 0, 260, 0.3);
  tone(1046, 260, 260, 0.3);
  tone(1318, 520, 480, 0.3);
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(`เชิญคิว ${spellLabel(label)} ที่บูธถ่ายภาพค่ะ`);
    u.lang = "th-TH";
    u.rate = 0.95;
    u.volume = 1;
    window.setTimeout(() => window.speechSynthesis.speak(u), 1000);
  }
}
