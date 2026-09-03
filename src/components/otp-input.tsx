"use client";

import { useRef } from "react";

export function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const commit = (next: string) => {
    onChange(next.slice(0, 6));
  };

  const focusIndex = (i: number) => {
    const el = refs.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleChange = (i: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "");
    const next = (value || "").split("");
    if (!digitsOnly) {
      next[i] = "";
      commit(next.join(""));
      return;
    }
    for (let j = 0; j < digitsOnly.length && i + j < 6; j++) {
      next[i + j] = digitsOnly[j];
    }
    commit(next.join(""));
    const nextIndex = Math.min(i + digitsOnly.length, 5);
    if (digitsOnly.length > 0 && nextIndex < 6) {
      focusIndex(nextIndex);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      focusIndex(i - 1);
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={6}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
          className="h-14 w-11 sm:h-16 sm:w-14 max-w-14 rounded-xl border border-zinc-300 bg-white text-center text-xl font-extrabold font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-950/5 disabled:opacity-50"
        />
      ))}
    </div>
  );
}
