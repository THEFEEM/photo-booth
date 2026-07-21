/** ยิง broadcast ไปที่ Supabase Realtime channel "queue" (fire-and-forget)
 *  client ทุกจอ subscribe event "update" แล้ว refetch — มี polling เป็น fallback อยู่แล้ว */
export async function notifyQueueUpdate(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [{ topic: "queue", event: "update", payload: { at: Date.now() } }],
      }),
    });
  } catch {
    // ignore — polling fallback ฝั่ง client ทำงานแทน
  }
}
