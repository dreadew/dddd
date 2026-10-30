"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { questionText } from "@/content/chapters";
import { fillName } from "@/lib/config";
import { dodgePosition, type Box } from "@/lib/dodge";
import type { ChapterBodyProps } from "./types";

type QuestionProps = { onYes: () => void } & Partial<Pick<ChapterBodyProps, "chapter" | "name">>;

// Отступ от краёв области, высота закреплённого плеера и пауза между прыжками.
const MARGIN = 12;
const PLAYER_INSET = 112;
const COOLDOWN_MS = 220;
// Насколько близко мышь может подойти к «нет», прежде чем та убежит.
const NEAR_PX = 28;

const toBox = (r: DOMRect): Box => ({ x: r.left, y: r.top, w: r.width, h: r.height });

function intersect(a: Box, b: Box): Box {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x);
  const h = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y);
  return { x, y, w, h };
}

export function Question({ onYes, chapter, name = "ты" }: QuestionProps) {
  const reduced = useReducedMotion();
  const [attempts, setAttempts] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [said, setSaid] = useState(false);
  // Кнопки оживают только когда вопрос уже проявился.
  const [armed, setArmed] = useState(false);

  const arenaRef = useRef<HTMLDivElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  // Обёртка «нет» не двигается: её прямоугольник и есть «домашнее» место кнопки.
  const homeRef = useRef<HTMLSpanElement>(null);
  const lastDodge = useRef(0);

  const teases = questionText.noTeases;
  const exhausted = reduced === true && attempts >= teases.length;

  // При повороте экрана или ресайзе возвращаем «нет» домой, чтобы она не оказалась за краем.
  useEffect(() => {
    const reset = () => setOffset({ x: 0, y: 0 });
    window.addEventListener("resize", reset);
    return () => window.removeEventListener("resize", reset);
  }, []);

  function tease() {
    setAttempts((n) => n + 1);
  }

  function dodge(pointer?: { x: number; y: number }) {
    if (reduced) return;
    const now = performance.now();
    if (now - lastDodge.current < COOLDOWN_MS) return;
    const arena = arenaRef.current;
    const home = homeRef.current;
    if (!arena || !home) return;
    lastDodge.current = now;

    const homeBox = toBox(home.getBoundingClientRect());
    const current: Box = { ...homeBox, x: homeBox.x + offset.x, y: homeBox.y + offset.y };
    const viewport: Box = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight - PLAYER_INSET };
    const bounds = intersect(toBox(arena.getBoundingClientRect()), viewport);
    const yes = yesRef.current ? toBox(yesRef.current.getBoundingClientRect()) : undefined;
    const from = pointer ?? { x: current.x + current.w / 2, y: current.y + current.h / 2 };

    const next = dodgePosition(current, from, bounds, MARGIN, yes);
    setOffset({ x: next.x - homeBox.x, y: next.y - homeBox.y });
    tease();
  }

  function nearNo(e: PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse" || !homeRef.current) return;
    const r = homeRef.current.getBoundingClientRect();
    const x = r.left + offset.x;
    const y = r.top + offset.y;
    const near =
      e.clientX > x - NEAR_PX &&
      e.clientX < x + r.width + NEAR_PX &&
      e.clientY > y - NEAR_PX &&
      e.clientY < y + r.height + NEAR_PX;
    if (near) dodge({ x: e.clientX, y: e.clientY });
  }

  function onNoClick(e: MouseEvent<HTMLButtonElement>) {
    // Нажатие на «нет» никогда не означает «нет»: это просто ещё одна шутка.
    if (reduced) {
      if (!exhausted) tease();
      return;
    }
    // Клавиатура (detail === 0) убегает всегда; касание, которое всё же долетело,
    // уже вызвало прыжок на pointerdown, поэтому второй раз в том же жесте не прыгаем.
    if (e.detail === 0) lastDodge.current = 0;
    dodge();
  }

  function sayYes() {
    if (!armed) return;
    setSaid(true);
    onYes();
  }

  const teaseIndex = Math.min(attempts, teases.length) - 1;
  const currentTease = attempts > 0 ? teases[reduced ? teaseIndex : (attempts - 1) % teases.length] : "";
  const noLabel = reduced && attempts > 0 ? currentTease : questionText.no;
  const yesScale = reduced ? 1 : 1 + Math.min(attempts, 5) * 0.04;

  const appear = (delay: number, reducedDelay = 0) => ({
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: reduced ? { duration: 0.3, delay: reducedDelay } : { duration: 1.4, delay, ease: "easeOut" as const },
  });

  return (
    <div className="flex min-h-full flex-col justify-center gap-8 py-12">
      {chapter && (
        <div className="flex flex-col gap-4 text-center text-lg leading-relaxed">
          {chapter.lines.map((line, i) => (
            <motion.p key={i} {...appear(0.8 + i * 1.2)}>
              {fillName(line, name)}
            </motion.p>
          ))}
        </div>
      )}

      <motion.p {...appear(4.2)} className="subtitle text-center text-[1.625rem] leading-snug">
        {fillName(questionText.ask, name)}
      </motion.p>

      <div aria-live="polite" className="-my-2 flex min-h-14 items-center justify-center text-center">
        {said ? (
          <p className="subtitle text-xl text-[#f7c08a]">{questionText.afterYes}</p>
        ) : exhausted ? (
          <p className="sr-only">{questionText.noDisabledHint}</p>
        ) : !reduced && currentTease ? (
          <motion.p
            key={attempts}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="subtitle text-lg text-[#f7c08a]"
          >
            {currentTease}
          </motion.p>
        ) : reduced && currentTease ? (
          <p className="sr-only">{currentTease}</p>
        ) : null}
      </div>

      <motion.div
        ref={arenaRef}
        {...appear(2.3, 0.4)}
        onAnimationComplete={() => setArmed(true)}
        onPointerMove={armed ? nearNo : undefined}
        aria-hidden={armed ? undefined : true}
        className={`relative w-full ${reduced ? "" : "min-h-64"} ${armed ? "" : "pointer-events-none"}`}
      >
        <div className="flex w-full flex-wrap items-start justify-center gap-4">
          <motion.button
            ref={yesRef}
            type="button"
            onClick={sayYes}
            disabled={!armed}
            tabIndex={armed ? undefined : -1}
            animate={{ scale: yesScale }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="relative z-10 min-h-14 min-w-32 rounded-full border border-[#f4a259] bg-[#f4a259] px-8 py-3 text-lg font-semibold text-[#0b1026] shadow-[0_0_24px_rgb(244_162_89/0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7c08a] active:bg-[#f7c08a]"
          >
            {questionText.yes}
          </motion.button>

          {!said && (
            <span ref={homeRef} className="relative inline-flex">
              <motion.button
                type="button"
                onClick={onNoClick}
                onPointerEnter={(e) => dodge({ x: e.clientX, y: e.clientY })}
                onPointerDown={(e) => {
                  if (reduced) return;
                  // На касании убегаем ещё до того, как палец поднимется.
                  e.preventDefault();
                  dodge({ x: e.clientX, y: e.clientY });
                }}
                disabled={exhausted || !armed}
                tabIndex={armed ? undefined : -1}
                animate={{ x: offset.x, y: offset.y }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className="min-h-14 min-w-24 max-w-56 touch-manipulation rounded-full border border-white/25 bg-[#0b1026]/60 px-6 py-3 text-base font-medium text-[#f3e9dc] backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7c08a] disabled:opacity-50"
              >
                {noLabel}
              </motion.button>
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
