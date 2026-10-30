"use client";

import { track } from "@/content/track";
import { useAudio } from "./AudioProvider";

export function Player() {
  const { status, progress, toggle } = useAudio();
  const playing = status === "playing";
  const disabled = status === "error" || status === "idle";
  const label =
    status === "error"
      ? "Музыка недоступна"
      : playing
        ? "Поставить на паузу"
        : "Включить музыку";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1026]/85 p-2.5 text-[#f3e9dc] shadow-lg backdrop-blur-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cover.svg"
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-semibold leading-tight">{track.title}</p>
          <p className="truncate text-sm italic leading-tight opacity-80">{track.artist}</p>
          <div
            className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label="Прогресс трека"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full rounded-full bg-orange-400 motion-safe:transition-[width] motion-safe:duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={label}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-400 text-[#0b1026] motion-safe:transition-opacity disabled:opacity-40"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
