// สร้าง PromptPay QR payload ตาม EMVCo (dynamic, ระบุยอด)
function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function promptPayPayload(target: string, amountThb: number): string {
  const digits = target.replace(/[^0-9]/g, "");
  let proxy: string;
  if (digits.length === 13) {
    proxy = tlv("02", digits); // เลขบัตรประชาชน
  } else if (digits.length === 15) {
    proxy = tlv("03", digits); // e-wallet
  } else {
    proxy = tlv("01", "0066" + digits.replace(/^0/, "")); // เบอร์โทร
  }
  const merchant = tlv("29", tlv("00", "A000000677010111") + proxy);
  const body =
    tlv("00", "01") +
    tlv("01", "12") + // dynamic QR (ใช้ครั้งเดียว)
    merchant +
    tlv("53", "764") +
    tlv("54", amountThb.toFixed(2)) +
    tlv("58", "TH");
  const withCrcId = body + "6304";
  return withCrcId + crc16(withCrcId);
}
