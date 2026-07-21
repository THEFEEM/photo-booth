/** อัปโหลดสลิปเข้า Supabase Storage bucket "slips" (private) */
export async function uploadSlip(
  bookingId: string,
  file: Blob,
  filename: string
): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const ext = (filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${bookingId}-${Date.now()}.${ext || "jpg"}`;
  try {
    const res = await fetch(`${url}/storage/v1/object/slips/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": file.type || "image/jpeg",
        "x-upsert": "true",
      },
      body: file,
    });
    return res.ok ? path : null;
  } catch {
    return null;
  }
}

/** สร้าง signed URL ให้พนักงานเปิดดูรูปสลิป (bucket private) */
export async function signSlipUrl(path: string, expiresInSec = 3600): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/storage/v1/object/sign/slips/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: expiresInSec }),
    });
    if (!res.ok) return null;
    const body: { signedURL?: string } = await res.json();
    return body.signedURL ? `${url}/storage/v1${body.signedURL}` : null;
  } catch {
    return null;
  }
}
