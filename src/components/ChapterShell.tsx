"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Chapter } from "@/content/chapters";
import { fillName } from "@/lib/config";

export function ChapterShell({
  chapter,
  name = "ты",
  children,
}: {
  chapter: Chapter;
  name?: string;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <section
      id={chapter.id}
      tabIndex={-1}
      aria-labelledby={`${chapter.id}-title`}
      className="flex min-h-dvh outline-none snap-start flex-col justify-center px-6 pt-16 pb-[calc(7rem+env(safe-area-inset-bottom))]"
    >
      <motion.div
        className="mx-auto flex w-full max-w-md flex-col gap-8"
        initial={{ opacity: 0, y: reduced ? 0 : 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: reduced ? 0.01 : 1, ease: "easeOut" }}
      >
        <header className="flex flex-col gap-3 text-center">
          <h2
            id={`${chapter.id}-title`}
            className="text-xs font-medium uppercase tracking-[0.25em] text-[#f7c08a]/80"
          >
            {fillName(chapter.title, name)}
          </h2>
          <p className="subtitle text-2xl leading-snug">{fillName(chapter.subtitle, name)}</p>
        </header>
        {children}
      </motion.div>
    </section>
  );
}
