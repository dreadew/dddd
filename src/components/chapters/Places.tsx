"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useAudio } from "@/components/AudioProvider";
import { featuredClip } from "@/content/track";
import { fillName } from "@/lib/config";
import type { ChapterBodyProps } from "./types";

const HORIZON = 120;

// Фонари набережной слева
const lamps = [18, 54, 90, 126];

// Далёкие дома на том берегу: [x, y верхушки, ширина]; часть окон тихо мерцает
const skyline = [
  [150, 108, 8],
  [160, 102, 10],
  [172, 110, 7],
  [180, 104, 8],
  [196, 109, 9],
  [212, 104, 7],
  [226, 111, 10],
  [244, 106, 8],
  [262, 110, 9],
  [284, 103, 8],
  [300, 108, 10],
  [318, 105, 7],
  [334, 110, 9],
];

// Утки на воде: [x, y ватерлинии, масштаб, отражение по горизонтали]
const ducks: [number, number, number, boolean][] = [
  [196, 160, 2, false],
  [238, 172, 1.6, false],
  [310, 150, 1.3, true],
];

// Силуэт утки, клюв смотрит вправо; ватерлиния на y = 0
function Duck({ x, y, scale, flip, index, animate }: { x: number; y: number; scale: number; flip: boolean; index: number; animate: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* Круги на воде вокруг утки */}
      <ellipse
        cx="0"
        cy="0.6"
        rx="13"
        ry="1.6"
        fill="none"
        stroke="#f3e9dc"
        strokeOpacity="0.18"
        strokeWidth="0.6"
        className={animate ? "places-shimmer" : undefined}
        style={{ animationDelay: `${index * 1.1}s` }}
      />
      <ellipse
        cx="0"
        cy="1"
        rx="19"
        ry="2.4"
        fill="none"
        stroke="#f3e9dc"
        strokeOpacity="0.1"
        strokeWidth="0.6"
        className={animate ? "places-shimmer" : undefined}
        style={{ animationDelay: `${index * 1.1 + 1.6}s` }}
      />
      <g className={animate ? "duck-bob" : undefined} style={{ animationDelay: `${index * 0.9}s` }}>
        {/* Хвост, тело, шея, голова */}
        <path
          d="M-10 -6.5 L-6 -3.5 Q-8.5 0.4 -3 0.4 L5 0.4 Q9 0.4 8.6 -3 Q8 -5.4 5.4 -5.6 Q6.6 -7.6 6.6 -9.2 Q6.6 -12 4 -12 Q1.4 -12 1.4 -9.4 Q1.4 -7.6 2.4 -5.8 L-4 -5.6 Z"
          fill="#0d0f28"
          stroke="#f7c08a"
          strokeOpacity="0.55"
          strokeWidth="0.45"
          strokeLinejoin="round"
        />
        {/* Клюв */}
        <path d="M6.4 -10.2 L9.6 -9.4 L6.5 -8.4 Z" fill="#f4a259" opacity="0.8" />
        {/* Глаз */}
        <circle cx="4.6" cy="-9.9" r="0.55" fill="#f7c08a" opacity="0.8" />
      </g>
      {/* Отражение утки */}
      <ellipse cx="0" cy="2.4" rx="8" ry="1" fill="#f7c08a" opacity="0.08" />
    </g>
  );
}

export function Places({ chapter, name }: Pick<ChapterBodyProps, "chapter" | "name">) {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const onScreen = useInView(svgRef);

  // Отрывок песни: включается, когда глава почти целиком на экране, и обрывается, когда она уходит.
  const rootRef = useRef<HTMLDivElement>(null);
  const mostlyInView = useInView(rootRef, { amount: 0.6 });
  const { track, status, enterClip, exitClip } = useAudio();
  useEffect(() => {
    if (mostlyInView) {
      // Удаляем вызов enterClip(), чтобы не включался трек
    } else {
      exitClip();
    }
  }, [mostlyInView, exitClip]);
  const clipOn = false;
  const clipPlaying = false;

  const fade = (delay: number) => ({
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.4 },
    transition: reduced ? { duration: 0.3 } : { duration: 1.4, delay, ease: "easeOut" as const },
  });

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgb(11_16_38/0.2),rgb(58_42_77/0.45))]">
        <svg
          ref={svgRef}
          viewBox="0 46 360 150"
          className={`block h-auto w-full ${onScreen ? "" : "places-paused"} ${clipPlaying ? "" : "places-clip-paused"}`}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient id="places-lamp">
              <stop offset="0%" stopColor="#f7c08a" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f7c08a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="places-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c1a3d" />
              <stop offset="100%" stopColor="#0b1026" />
            </linearGradient>
            <linearGradient id="places-reflect" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4a259" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
            </linearGradient>
          </defs>

           {/* Вода */}
           <motion.g {...fade(0.1)}>
             <rect x="0" y={HORIZON} width="360" height={200 - HORIZON} fill="url(#places-water)" />
             {[132, 146, 162, 180].map((y, i) => (
               <line
                 key={y}
                 x1={30 + i * 18}
                 x2={330 - i * 22}
                 y1={y}
                 y2={y}
                 stroke="#f3e9dc"
                 strokeOpacity={0.08}
                 strokeWidth="1"
                 className={reduced ? undefined : "places-shimmer"}
                 style={{ animationDelay: `${i * 0.8}s` }}
               />
             ))}
           </motion.g>

           {/* Далёкий берег */}
           <motion.g {...fade(0.3)}>
             {skyline.map(([x, y, w], i) => (
               <g key={i}>
                 <rect x={x} y={y} width={w} height={HORIZON - y} fill="#16153a" />
                 <rect
                   x={x + 3}
                   y={y + 4}
                   width="2"
                   height="2"
                   fill="#f7c08a"
                   opacity="0.5"
                   className={i % 4 === 1 && !reduced ? "places-flicker" : undefined}
                   style={{ animationDelay: `${(i % 5) * 1.3}s` }}
                 />
               </g>
             ))}
           </motion.g>

           {/* Набережная: деревья, перила, фонари и их отражения */}
           <motion.g {...fade(0.5)}>
             <ellipse cx="36" cy="100" rx="26" ry="18" fill="#100f2a" />
             <ellipse cx="108" cy="98" rx="30" ry="20" fill="#100f2a" />
             <rect x="0" y="114" width="150" height="6" fill="#0a0c20" />
             <line x1="0" y1="106" x2="150" y2="106" stroke="#2a2550" strokeWidth="1.2" />
             {Array.from({ length: 16 }, (_, i) => (
               <line
                 key={i}
                 x1={i * 10}
                 x2={i * 10}
                 y1="106"
                 y2="114"
                 stroke="#2a2550"
                 strokeWidth="1"
               />
             ))}
             {lamps.map((x) => (
               <g key={x}>
                 <line x1={x} x2={x} y1="114" y2="80" stroke="#2f2a55" strokeWidth="1.5" />
                 <circle cx={x} cy="79" r="11" fill="url(#places-lamp)" />
                 <circle cx={x} cy="79" r="2.2" fill="#f7c08a" />
                 {/* Пока звучит отрывок, отражения мягко пульсируют в такт */}
                 <g
                   className={clipOn && !reduced ? "places-clip-pulse" : undefined}
                   style={{ animationDelay: `${(x / 36) * 0.235}s` }}
                 >
                   <rect
                     x={x - 1.5}
                     y={HORIZON + 2}
                     width="3"
                     height="40"
                     fill="url(#places-reflect)"
                     className={reduced ? undefined : "places-shimmer"}
                     style={{ animationDelay: `${x / 40}s` }}
                   />
                 </g>
               </g>
             ))}
           </motion.g>

           {/* Утки, которых мы встречали там каждый раз */}
           <motion.g {...fade(0.9)}>
             {ducks.map(([x, y, scale, flip], i) => (
               <Duck key={i} x={x} y={y} scale={scale} flip={flip} index={i} animate={!reduced} />
             ))}
           </motion.g>
        </svg>
        {/* Подпись в духе киносубтитров, пока звучит отрывок */}
        <motion.p
          aria-hidden="true"
          className="subtitle pointer-events-none absolute inset-x-0 bottom-2 text-center text-sm"
          initial={false}
          animate={{ opacity: clipPlaying ? 0.95 : 0, y: clipPlaying || reduced ? 0 : 4 }}
          transition={{ duration: reduced ? 0.2 : 1.2, ease: "easeOut" }}
        >
          {/* Нота рисуется SVG: в Lora нет глифа ♪, браузер взял бы его из другого шрифта */}
          <svg viewBox="0 0 12 14" className="mr-1.5 inline-block h-[0.9em] w-auto align-[-0.1em]" fill="currentColor">
            <path d="M4 1.5 11 0v9.6a2 2 0 1 1-1.2-1.83V3.1L5.2 4v7.6A2 2 0 1 1 4 9.77z" />
          </svg>
          {featuredClip.title}
        </motion.p>
      </div>

      <div className="flex flex-col gap-4 text-center text-lg leading-relaxed">
        {chapter.lines.map((line, i) => (
          <motion.p key={i} {...fade(1.2 + i * 0.7)}>
            {fillName(line, name)}
          </motion.p>
        ))}
      </div>
    </div>
  );
}
