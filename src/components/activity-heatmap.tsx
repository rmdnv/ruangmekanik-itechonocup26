"use client";

import type { ActivityDay } from "@/lib/queries";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function cellClass(count: number): string {
  if (count >= 4) return "bg-zinc-950";
  if (count === 3) return "bg-zinc-700";
  if (count === 2) return "bg-zinc-500";
  if (count === 1) return "bg-zinc-300";
  return "bg-zinc-100";
}

export function ActivityHeatmap({ days }: { days: ActivityDay[] }) {
  if (days.length === 0) {
    return (
      <div className="border border-dashed border-zinc-200 rounded-2xl p-8 text-center text-xs text-zinc-400">
        Data aktivitas belum tersedia.
      </div>
    );
  }

  const firstDate = new Date(`${days[0].date}T00:00:00`);
  const leading = firstDate.getDay();

  const weeks: number[][] = [];
  let week: number[] = [];
  for (let i = 0; i < leading; i++) week.push(-1);

  for (const day of days) {
    week.push(day.count);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  while (week.length < 7) week.push(-1);
  if (week.length > 0) weeks.push(week);

  const total = days.reduce((acc, d) => acc + d.count, 0);
  const maxActive = Math.max(...days.map((d) => d.count), 1);

  const monthLabelAt = (weekIndex: number): string => {
    if (weekIndex === 0) {
      const mon = new Date(`${days[0].date}T00:00:00`).getMonth();
      return MONTHS[mon];
    }
    const cells = weeks[weekIndex];
    const activeIdx = cells.findIndex((c) => c !== -1);
    if (activeIdx === -1) return "";
    const cellDate = new Date(`${days[0].date}T00:00:00`);
    cellDate.setDate(cellDate.getDate() + weekIndex * 7 - leading + activeIdx);
    const month = cellDate.getMonth();
    const prevDate = new Date(cellDate);
    prevDate.setDate(prevDate.getDate() - 1);
    return prevDate.getMonth() !== month ? MONTHS[month] : "";
  };

  return (
    <div className="border border-zinc-200 rounded-2xl bg-white p-6 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-950">Aktivitas Kontribusi</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {total} kontribusi dalam 365 hari terakhir (komen, panduan, &amp; kasus diagnosa)
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-zinc-400 mr-1">Maks {maxActive}/hari</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`h-3 w-3 rounded-[3px] ${cellClass(level)}`} />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1">
          {weeks.map((cells, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              <span className="h-3 text-[9px] font-medium text-zinc-400">{monthLabelAt(wi)}</span>
              {cells.map((count, di) => {
                const date = new Date(`${days[0].date}T00:00:00`);
                date.setDate(date.getDate() + wi * 7 - leading + di);
                const label = date.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                return (
                  <div
                    key={di}
                    title={count > 0 ? `${count} kontribusi · ${label}` : `Tidak ada aktivitas · ${label}`}
                    className={`h-3 w-3 rounded-[3px] ${count > 0 ? cellClass(count) : "bg-zinc-100"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end text-[10px] text-zinc-400 font-mono">
        <span>Lebih sedikit</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`h-2.5 w-2.5 rounded-[2px] ${cellClass(level)}`} />
        ))}
        <span>Lebih banyak</span>
      </div>
    </div>
  );
}