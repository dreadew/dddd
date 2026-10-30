"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { fillName } from "@/lib/config";
import type { ChapterBodyProps } from "./types";

export function Evening({ chapter, name }: Pick<ChapterBodyProps, "chapter" | "name">) {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40) setScrolled(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
               : { duration: 1.4, delay: 0.8 + i * 1.4, ease: "easeOut" }
           }
          className={i === chapter.lines.length - 1 ? "subtitle text-2xl text-[#f7c08a]" : undefined}
        >
          {fillName(line, name)}
        </motion.p>
      ))}
      <AnimatePresence>
        {!scrolled && (
          <motion.div
            aria-hidden="true"
            className="mt-6 flex flex-col items-center gap-1 text-xs tracking-widest uppercase opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0, transition: { duration: 0.5, delay: 0 } }}
            transition={{ duration: 0.8, delay: reduced ? 0 : 4.5 + chapter.lines.length * 0.2 }}
          >
            <span>листай вниз</span>
            <svg className="scroll-cue-chevron" width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 2l6 6 6-6" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
