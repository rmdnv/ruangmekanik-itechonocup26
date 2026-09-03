export function PageSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse border border-zinc-200 rounded-2xl p-6 bg-zinc-50/50">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="h-5 w-24 rounded-md bg-zinc-200" />
            <div className="h-3 w-32 rounded bg-zinc-200" />
          </div>
          <div className="h-5 w-3/4 rounded-lg bg-zinc-200 mb-3" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-zinc-200" />
            <div className="h-3 w-2/3 rounded bg-zinc-200" />
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center">
            <div className="h-3 w-24 rounded bg-zinc-200" />
            <div className="h-3 w-32 rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}