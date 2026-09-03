export interface AvatarAuthor {
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
}

export function AuthorAvatar({
  author,
  size = "md",
}: {
  author?: AvatarAuthor | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const src = author?.avatarUrl || author?.image || null;
  const letter = (author?.name || author?.username || "T").trim().charAt(0).toUpperCase();

  const sizeClasses: Record<string, string> = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-20 w-20 text-2xl",
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- lightweight dynamic avatar
      <img
        src={src}
        alt={author?.name || author?.username || "User"}
        loading="lazy"
        className={`${sizeClasses[size]} rounded-full object-cover bg-zinc-100 ring-1 ring-zinc-200 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold uppercase font-mono ring-1 ring-zinc-200 shrink-0`}
    >
      {letter}
    </div>
  );
}