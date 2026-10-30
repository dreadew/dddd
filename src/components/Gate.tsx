"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useAudio } from "./AudioProvider";

export function Gate({ onStart }: { onStart: () => void }) {
  const { start } = useAudio();
  const reduced = useReducedMotion();

  const handleStart = () => {
    // play() должен вызваться синхронно в обработчике жеста; ошибка аудио не мешает идти дальше.
    start().catch(() => {});
    onStart();
  };

  return (
    <motion.main
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-10 px-6 pb-[22vh] text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 1.2 }}
    >
      <p className="subtitle text-2xl">небольшой интерактив</p>
      <button
        type="button"
        onClick={handleStart}
        className="rounded-full border border-[#f7c08a]/50 bg-[#f4a259]/15 px-8 py-4 text-base font-medium tracking-wide text-[#f3e9dc] shadow-[0_0_30px_rgb(244_162_89/0.25)] backdrop-blur-sm motion-safe:transition-colors hover:bg-[#f4a259]/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7c08a]"
      >
        Нажми, чтобы начать
      </button>
      <p className="text-xs opacity-50">лучше со звуком</p>
    </motion.main>
  );
}
