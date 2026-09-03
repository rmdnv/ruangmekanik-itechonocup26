import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="hidden md:flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        <MessageSquare className="h-7 w-7 text-zinc-400" />
      </div>
      <p className="mt-4 text-sm font-semibold text-zinc-700">Pilih percakapan</p>
      <p className="mt-1 text-xs text-zinc-400">
        Kirim pesan ke mekanik lain dari profil mereka.
      </p>
    </div>
  );
}
