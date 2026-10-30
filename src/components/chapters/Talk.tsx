"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fillName } from "@/lib/config";
import { DateScene } from "./DateScene";
import type { ChapterBodyProps } from "./types";

type TalkProps = Partial<Pick<ChapterBodyProps, "chapter" | "name">>;

export function Talk({ chapter, name = "ты" }: TalkProps) {
  const reduced = useReducedMotion();

  const appear = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: reduced ? { duration: 0.3 } : { duration: 0.9, delay, ease: "easeOut" as const },
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Театр, у входа в который мы встретились, и двое, пожимающие руки */}
      <DateScene />

      {chapter && (
        <div className="flex flex-col gap-4 text-center text-lg leading-relaxed">
          {chapter.lines.map((line, i) => (
            <motion.p key={i} {...appear(0.3 + i * 0.5)}>
              {fillName(line, name)}
            </motion.p>
          ))}
        </div>
      )}
    </div>
  );
}
