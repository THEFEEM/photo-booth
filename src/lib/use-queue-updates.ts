"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowser } from "./supabase-browser";

/** refetch เมื่อมี broadcast "queue/update" + polling fallback ทุก pollMs */
export function useQueueUpdates(onUpdate: () => void, pollMs = 5000): void {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    cbRef.current();
    const interval = setInterval(() => cbRef.current(), pollMs);
    const supabase = getSupabaseBrowser();
    const channel = supabase
      ?.channel("queue")
      .on("broadcast", { event: "update" }, () => cbRef.current())
      .subscribe();
    return () => {
      clearInterval(interval);
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [pollMs]);
}
