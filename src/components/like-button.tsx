"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";

type ToggleAction = (id: string) => Promise<unknown>;

export function LikeButton({
  id,
  initialCount = 0,
  initialLiked = false,
  toggle,
  label,
  className,
}: {
  id: string;
  initialCount?: number;
  initialLiked?: boolean;
  toggle: ToggleAction;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { count: initialCount, liked: initialLiked },
    (state, next: { count: number; liked: boolean }) => next
  );

  const handleClick = () => {
    startTransition(async () => {
      setOptimistic({
        count: optimistic.count + (optimistic.liked ? -1 : 1),
        liked: !optimistic.liked,
      });
      try {
        await toggle(id);
        router.refresh();
      } catch (e) {
        console.error("Like gagal", e);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={optimistic.liked}
      title={label ? `${label} — klik untuk ${optimistic.liked ? "batal" : "menyukai"}` : "Suka"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50",
        optimistic.liked
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-950",
        className
      )}
    >
      <ThumbsUp className={cn("h-3.5 w-3.5", optimistic.liked && "fill-current")} />
      {label && <span className="uppercase tracking-wider text-[10px]">{label}</span>}
      <span className="font-mono">{optimistic.count}</span>
    </button>
  );
}