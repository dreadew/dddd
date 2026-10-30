"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { fillName } from "@/lib/config";
import { DreamScene } from "./DreamScene";
import type { ChapterBodyProps } from "./types";

export function Night({ chapter, name }: Pick<ChapterBodyProps, "chapter" | "name">) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });

  // Затемнение всего экрана поверх неба (под текстом), пока глава на экране.
  const dim = (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] bg-[radial-gradient(ellipse_at_50%_45%,rgb(5_6_18/0.35),rgb(5_6_18/0.8)_75%)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: inView ? 1 : 0 }}
      transition={{ duration: reduced ? 0.3 : 1.8, ease: "easeInOut" }}
    />
  );

  return (
    <div ref={ref} className="relative isolate flex flex-col gap-4 text-center">
      {typeof document !== "undefined" && createPortal(dim, document.body)}

      {/* Мягкий тёплый свет, который медленно «дышит» */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 m-auto size-72 max-w-[90vw] rounded-full bg-[radial-gradient(circle,rgb(244_162_89/0.22),transparent_65%)]"
        initial={{ opacity: 0.4, scale: 1 }}
        animate={
          reduced || !inView
            ? { opacity: 0.45, scale: 1 }
            : { opacity: [0.35, 0.7, 0.35], scale: [0.94, 1.06, 0.94] }
        }
        transition={
          reduced || !inView
            ? { duration: 0.6 }
            : { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Тот самый сон: лавочка на краю обрыва в лесу, река и зарево завода вдали */}
      <div className="relative max-h-[50vh] w-full overflow-hidden">
        <DreamScene />
      </div>

      {chapter.lines.map((line, i) => (
        <motion.p
          key={i}
          className={
            i === chapter.lines.length - 1
              ? "subtitle text-2xl text-[#f7c08a]/90"
              : "text-lg leading-relaxed text-[#f3e9dc]/80"
          }
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
           transition={reduced ? { duration: 0.3 } : { duration: 1.8, delay: 1.2 + i * 1.5, ease: "easeOut" }}
        >
          {fillName(line, name)}
        </motion.p>
      ))}
    </div>
  );
}
