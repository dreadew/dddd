"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { finaleLines, finaleNote } from "@/content/chapters";
import { fillName } from "@/lib/config";
import type { ChapterBodyProps } from "./types";

type FinaleProps = Partial<Pick<ChapterBodyProps, "chapter" | "name">>;

const PIECE_COUNT = 22;
const colors = ["#f4a259", "#f7c08a", "#e07a5f", "#f3e9dc"];

// Детерминированные листья и искры света: позиции считаются от индекса.
const pieces = Array.from({ length: PIECE_COUNT }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 6 + ((i * 7) % 9),
  delay: ((i * 13) % 50) / 10,
  duration: 7 + ((i * 11) % 60) / 10,
  drift: ((i % 5) - 2) * 18,
  leaf: i % 3 !== 0,
  color: colors[i % colors.length],
}));

function Dawn({ reduced }: { reduced: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {/* Небо светлеет: тёплый слой проступает поверх ночного */}
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(180deg,#1a1838_0%,#4a3360_40%,#a35a5e_75%,#e08a5a_100%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.92 }}
        transition={{ duration: reduced ? 0.6 : 6, ease: "easeOut" }}
      />
      {/* Солнце поднимается из-за горизонта */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[60vh] bg-[radial-gradient(ellipse_at_50%_100%,rgb(247_192_138/0.75),rgb(244_162_89/0.25)_45%,transparent_72%)]"
        initial={{ opacity: 0, y: reduced ? 0 : "35%" }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.6 : 7, delay: reduced ? 0 : 1.2, ease: "easeOut" }}
      />
      {!reduced &&
        pieces.map((p, i) => (
          <span
            key={i}
            className="finale-fall absolute -top-8"
            style={
              {
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                "--drift": `${p.drift}px`,
              } as CSSProperties
            }
          >
            <span
              className={p.leaf ? "block rounded-[70%_0_70%_0]" : "block rounded-full"}
              style={{
                width: p.size,
                height: p.leaf ? p.size * 1.4 : p.size,
                background: p.color,
                boxShadow: p.leaf ? undefined : `0 0 10px 3px ${p.color}88`,
                opacity: p.leaf ? 0.85 : 0.7,
              }}
            />
          </span>
        ))}
    </div>
  );
}

export function Finale({ chapter, name = "ты" }: FinaleProps) {
  const reduced = useReducedMotion() === true;

  const appear = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: reduced ? { duration: 0.3 } : { duration: 1.1, delay, ease: "easeOut" as const },
  });

  let step = 0;
  const next = () => 0.4 + step++ * 0.6;

  return (
    <>
      {typeof document !== "undefined" && createPortal(<Dawn reduced={reduced} />, document.body)}
      <div className="flex flex-col gap-6 text-center text-lg leading-relaxed [text-shadow:0_1px_12px_rgb(0_0_0/0.55)]">
        {chapter?.lines.map((line, i) => (
          <motion.p key={`l${i}`} {...appear(next())}>
            {fillName(line, name)}
          </motion.p>
        ))}
        {finaleLines.map((line, i) => (
          <motion.p key={`f${i}`} {...appear(next())} className="subtitle text-2xl leading-snug">
            {fillName(line, name)}
          </motion.p>
        ))}
        {/* P.S.: последняя строка, мельче и курсивом, проявляется самой последней */}
        <motion.p
          {...appear(next() + 0.6)}
          data-finale-note
          className="mx-auto mt-4 max-w-sm text-base italic leading-relaxed text-[#fff1df]/90"
        >
          {fillName(finaleNote, name)}
        </motion.p>
      </div>
    </>
  );
}
