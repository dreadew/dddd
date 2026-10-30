"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { fillName } from "@/lib/config";
import type { ChapterBodyProps } from "./types";

const HORIZON = 120;

// Фонари набережной слева
const lamps = [18, 54, 90, 126];

// Складчатая крыша театра Камала: зубцы поднимаются к середине и опускаются
const roofPeaks = [
  [204, 82],
  [228, 74],
  [252, 66],
  [276, 62],
  [300, 66],
  [324, 76],
];

function roofPath() {
  const left = 190;
  const right = 346;
  const base = 94;
  let d = `M${left} ${base}`;
  roofPeaks.forEach(([x, y]) => {
    d += ` L${x} ${y} L${x + 12} ${base}`;
  });
  d += ` L${right} ${base} Z`;
  return d;
}

// Окна театра: два ряда; часть горит теплым, часть тихо мерцает
const windows = Array.from({ length: 2 }, (_, row) =>
  Array.from({ length: 12 }, (_, col) => ({
    x: 198 + col * 12,
    y: 100 + row * 9,
    lit: (col + row * 5) % 4 !== 0,
    flicker: (col * 7 + row * 3) % 5 === 0,
  })),
).flat();

// Далёкие дома на том берегу
const skyline = [
  [150, 108, 8],
  [160, 102, 10],
  [172, 110, 7],
  [180, 104, 8],
];

export function Places({ chapter, name }: Pick<ChapterBodyProps, "chapter" | "name">) {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const onScreen = useInView(svgRef);

  const fade = (delay: number) => ({
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.4 },
    transition: reduced ? { duration: 0.3 } : { duration: 1.4, delay, ease: "easeOut" as const },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgb(11_16_38/0.2),rgb(58_42_77/0.45))]">
        <svg
          ref={svgRef}
          viewBox="0 46 360 150"
          className={`block h-auto w-full ${onScreen ? "" : "places-paused"}`}
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

          {/* Озеро Кабан */}
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
                <rect x={x + 3} y={y + 4} width="2" height="2" fill="#f7c08a" opacity="0.5" />
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
            ))}
          </motion.g>

          {/* Театр Камала со складчатой крышей */}
          <motion.g {...fade(0.9)}>
            <path d={roofPath()} fill="#17163a" stroke="#f7c08a" strokeOpacity="0.25" strokeWidth="0.8" strokeLinejoin="round" />
            <rect x="190" y="94" width="156" height="26" fill="#121131" />
            {windows.map((w, i) => (
              <rect
                key={i}
                x={w.x}
                y={w.y}
                width="6"
                height="5"
                rx="0.5"
                fill={w.lit ? "#f7c08a" : "#2a2550"}
                opacity={w.lit ? 0.85 : 1}
                className={w.lit && w.flicker && !reduced ? "places-flicker" : undefined}
                style={w.flicker ? { animationDelay: `${(i % 5) * 1.3}s` } : undefined}
              />
            ))}
            <rect x="190" y={HORIZON + 2} width="156" height="22" fill="url(#places-reflect)" opacity="0.35" />
          </motion.g>
        </svg>
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
