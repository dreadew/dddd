"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fillName } from "@/lib/config";
import type { ChapterBodyProps } from "./types";

export function Evening({ chapter, name }: Pick<ChapterBodyProps, "chapter" | "name">) {
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col gap-5 text-center text-lg leading-relaxed">
      {chapter.lines.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={
            reduced
              ? { duration: 0.3 }
              : { duration: 1.1, delay: 0.5 + i * 0.9, ease: "easeOut" }
          }
          className={i === chapter.lines.length - 1 ? "subtitle text-2xl text-[#f7c08a]" : undefined}
        >
          {fillName(line, name)}
        </motion.p>
      ))}
    </div>
  );
}
