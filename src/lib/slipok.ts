// SlipOK check-slip API — https://slipok.com/api-documentation/check-slip/
// POST https://api.slipok.com/api/line/apikey/<BRANCH_ID>, header x-authorization
// ส่ง log:true = เช็คบัญชีผู้รับที่ผูกไว้ + ตรวจสลิปซ้ำฝั่ง SlipOK, amount = เช็คยอด

export type SlipVerifyResult =
  | {
      ok: true;
      transRef: string;
      amount: number;
      sendingBank: string | null;
      receivingBank: string | null;
      transTimestamp: string | null;
      raw: unknown;
    }
  | { ok: false; code: number | null; message: string; raw?: unknown };

const ERROR_MESSAGES: Record<number, string> = {
  1010: "สลิปเพิ่งโอน ธนาคารยังไม่ยืนยัน กรุณาลองใหม่ในอีกสักครู่",
  1012: "สลิปนี้ถูกใช้ไปแล้ว (สลิปซ้ำ)",
  1013: "ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ",
  1014: "บัญชีผู้รับเงินในสลิปไม่ถูกต้อง",
};

export async function verifySlip(
  file: Blob,
  filename: string,
  expectedAmountThb: number
): Promise<SlipVerifyResult> {
  const branchId = process.env.SLIPOK_BRANCH_ID;
  const apiKey = process.env.SLIPOK_API_KEY;
  if (!branchId || !apiKey) {
    return { ok: false, code: null, message: "ระบบตรวจสลิปยังไม่ถูกตั้งค่า (SLIPOK_BRANCH_ID / SLIPOK_API_KEY)" };
  }

  const form = new FormData();
  form.append("files", file, filename);
  form.append("log", "true");
  form.append("amount", String(expectedAmountThb));

  let res: Response;
  try {
    res = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: "POST",
      headers: { "x-authorization": apiKey },
      body: form,
    });
  } catch {
    return { ok: false, code: null, message: "เชื่อมต่อระบบตรวจสลิปไม่ได้ กรุณาลองใหม่" };
  }

  const body: {
    success?: boolean;
    code?: number;
    message?: string;
    data?: {
      success?: boolean;
      transRef?: string;
      amount?: number;
      sendingBank?: string;
      receivingBank?: string;
      transTimestamp?: string;
    };
  } | null = await res.json().catch(() => null);

  if (!res.ok || !body?.success || !body?.data?.success) {
    const code = body?.code ?? null;
    const message =
      (code != null && ERROR_MESSAGES[code]) ||
      body?.message ||
      `ตรวจสอบสลิปไม่ผ่าน (HTTP ${res.status})`;
    return { ok: false, code, message, raw: body };
  }

  const d = body.data;
  if (!d.transRef) {
    return { ok: false, code: null, message: "สลิปไม่มีเลขอ้างอิง (transRef)", raw: body };
  }
  if (Number(d.amount) !== Number(expectedAmountThb)) {
    return { ok: false, code: 1013, message: ERROR_MESSAGES[1013], raw: body };
  }
  const maxAgeMin = Number(process.env.MAX_SLIP_AGE_MINUTES ?? 60);
  if (d.transTimestamp) {
    const ageMin = (Date.now() - new Date(d.transTimestamp).getTime()) / 60000;
    if (Number.isFinite(ageMin) && ageMin > maxAgeMin) {
      return { ok: false, code: null, message: `สลิปเก่าเกิน ${maxAgeMin} นาที กรุณาใช้สลิปที่เพิ่งโอน`, raw: body };
    }
  }

  return {
    ok: true,
    transRef: d.transRef,
    amount: Number(d.amount),
    sendingBank: d.sendingBank ?? null,
    receivingBank: d.receivingBank ?? null,
    transTimestamp: d.transTimestamp ?? null,
    raw: body,
  };
}
