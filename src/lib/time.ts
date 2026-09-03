export function formatRelative(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  const diffMs = now - date.getTime();
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 0) return "baru saja";
  if (seconds < 60) return "baru saja";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}