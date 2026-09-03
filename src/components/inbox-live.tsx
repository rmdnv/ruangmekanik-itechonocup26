"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function InboxLive() {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource("/api/messages/stream");
    const refresh = () => router.refresh();
    source.addEventListener("message.changed", refresh);
    source.addEventListener("message.hidden", refresh);
    source.addEventListener("inbox", refresh);
    return () => {
      source.removeEventListener("message.changed", refresh);
      source.removeEventListener("message.hidden", refresh);
      source.removeEventListener("inbox", refresh);
      source.close();
    };
  }, [router]);

  return null;
}