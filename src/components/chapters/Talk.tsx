"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { talkQuestion, talkReactions } from "@/content/chapters";
import { fillName } from "@/lib/config";
import type { ChapterBodyProps } from "./types";

type TalkProps = Pick<ChapterBodyProps, "onAnswer"> &
  Partial<Pick<ChapterBodyProps, "chapter" | "name" | "answer">>;

export function Talk({ onAnswer, chapter, name = "ты", answer }: TalkProps) {
  const reduced = useReducedMotion();
  const [local, setLocal] = useState<number | null>(null);
  const picked = answer !== undefined ? answer : local;

  function choose(optionIndex: number) {
    setLocal(optionIndex);
    onAnswer(optionIndex);
  }

  const appear = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: reduced ? { duration: 0.3 } : { duration: 0.9, delay, ease: "easeOut" as const },
  });

  return (
    <div className="flex flex-col gap-8">
      {chapter && (
        <div className="flex flex-col gap-4 text-center text-lg leading-relaxed">
          {chapter.lines.map((line, i) => (
            <motion.p key={i} {...appear(0.3 + i * 0.5)}>
              {fillName(line, name)}
            </motion.p>
          ))}
        </div>
      )}

      <motion.fieldset
        {...appear(0.2)}
        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
      >
        <legend className="sr-only">{talkQuestion.prompt}</legend>
        <p aria-hidden="true" className="subtitle text-center text-2xl">
          {talkQuestion.prompt}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {talkQuestion.options.map((option, oi) => {
            const active = picked === oi;
            return (
              <button
                key={oi}
                type="button"
                aria-pressed={active}
                onClick={() => choose(oi)}
                className={`min-h-12 rounded-full border px-4 py-3 text-base font-medium motion-safe:transition-colors motion-safe:duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7c08a] ${
                  active
                    ? "border-[#f4a259] bg-[#f4a259] text-[#0b1026]"
                    : "border-white/20 bg-transparent text-[#f3e9dc] active:bg-white/10"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        <div aria-live="polite" className="min-h-14 text-center">
          <AnimatePresence mode="wait">
            {picked !== null && (
              <motion.p
                key={picked}
                initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0.15 : 0.5, ease: "easeOut" }}
                className="subtitle text-lg text-[#f7c08a]"
              >
                {fillName(talkReactions[picked], name)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.fieldset>
    </div>
  );
}
