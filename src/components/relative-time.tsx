"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatRelative } from "@/lib/time";

export function RelativeTime({ date }: { date: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <time dateTime={date} title={formatDateTime(date)} className="text-zinc-400">
      {formatRelative(date, now)}
    </time>
  );
}