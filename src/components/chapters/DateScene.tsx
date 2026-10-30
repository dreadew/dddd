"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

// Первое свидание: сказочный театр ночью, вид сбоку и чуть спереди.
// На первом плане белая полукруглая колоннада у входа, за ней в перспективе
// уходят башни с золотыми куполами, щипцы с часами и синие витражи.
// Под колоннами, почти у самого входа, двое идут навстречу и пожимают руки.
// Чисто декоративная картинка: только фигуры, без текста.

const W = 360;
const H = 300;
// Где стоят ноги человечков
const FEET = 292;
// Человечки нарисованы в масштабе 1 (рост ~29) и увеличены: на телефоне ~60 px
const FIGURE = 2.2;
// Точка встречи: ровно перед входом в ротонду
const MEET = 210;

// Детерминированный генератор: разметка на сервере и клиенте совпадает.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const stars = (() => {
  const rand = seeded(20231014);
  return Array.from({ length: 24 }, (_, i) => ({
    x: Math.round(rand() * W * 10) / 10,
    y: Math.round((4 + rand() * 70) * 10) / 10,
    r: rand() < 0.25 ? 0.9 : 0.55,
    o: Math.round((0.35 + rand() * 0.45) * 100) / 100,
    twinkle: i % 4 === 0,
  }));
})();

const r1 = (n: number) => Math.round(n * 10) / 10;

// Луковка купола: основание на y = base, высота h, полуширина w
function onion(cx: number, base: number, h: number, w: number) {
  return `M${r1(cx - w * 0.55)} ${r1(base)} C${r1(cx - w * 1.25)} ${r1(base - h * 0.3)} ${r1(cx - w * 0.85)} ${r1(base - h * 0.62)} ${r1(cx)} ${r1(base - h)} C${r1(cx + w * 0.85)} ${r1(base - h * 0.62)} ${r1(cx + w * 1.25)} ${r1(base - h * 0.3)} ${r1(cx + w * 0.55)} ${r1(base)} Z`;
}

// Зубцы поверху: ряд прямоугольничков вдоль линии от (x0, y0) до (x1, y1)
function merlons(x0: number, y0: number, x1: number, y1: number, size: number) {
  const n = Math.max(2, Math.round((x1 - x0) / (size * 2)));
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const x = x0 + t * (x1 - x0 - size);
    const y = y0 + t * (y1 - y0);
    return `M${r1(x)} ${r1(y)} h${size} v${-size} h${-size} Z`;
  }).join(" ");
}

// Арка с полукруглым верхом
function arch(x: number, top: number, w: number, bottom: number) {
  const r = w / 2;
  return `M${r1(x)} ${r1(bottom)} L${r1(x)} ${r1(top + r)} A${r1(r)} ${r1(r)} 0 0 1 ${r1(x + w)} ${r1(top + r)} L${r1(x + w)} ${r1(bottom)} Z`;
}

// Ротонда-колоннада: барабан, выступающий к зрителю. Верх выше глаз, поэтому
// его ближняя середина кажется выше краёв (дуга ∩), низ ниже глаз: дуга ∪.
const ROT_L = 66;
const ROT_R = 354;
const ROT_C = (ROT_L + ROT_R) / 2;
const ROT_R_X = (ROT_R - ROT_L) / 2;
function rotY(x: number, edge: number, center: number) {
  const t = (x - ROT_L) / (ROT_R - ROT_L);
  return edge + (center - edge) * 4 * t * (1 - t);
}
// Кривая через три точки ротонды (края и середина), как квадратичная Безье
function rotCurve(edge: number, center: number, from = ROT_L, to = ROT_R, move = true) {
  return `${move ? "M" : "L"}${from} ${edge} Q${ROT_C} ${2 * center - edge} ${to} ${edge}`;
}

// Высоты ротонды: парапет, карниз, низ антаблемента, низ колонн
const PARAPET = { edge: 170, center: 152 };
const CORNICE = { edge: 176, center: 158 };
const BEAM = { edge: 192, center: 176 };
const BASE = { edge: 262, center: 276 };

const rotunda = {
  parapet: `${rotCurve(PARAPET.edge, PARAPET.center)} ${rotCurve(CORNICE.edge, CORNICE.center, ROT_R, ROT_L, false)} Z`,
  beam: `${rotCurve(CORNICE.edge, CORNICE.center)} ${rotCurve(BEAM.edge, BEAM.center, ROT_R, ROT_L, false)} Z`,
  hall: `${rotCurve(BEAM.edge, BEAM.center)} ${rotCurve(BASE.edge, BASE.center, ROT_R, ROT_L, false)} Z`,
};

// Колонны по дуге барабана: угол от оси, ближние шире и светлее
const columns = Array.from({ length: 11 }, (_, i) => {
  const a = ((i - 5) * 16 * Math.PI) / 180;
  const x = ROT_C + ROT_R_X * Math.sin(a);
  const near = Math.cos(a);
  const w = 2.5 + near * 7.5;
  return {
    x: r1(x),
    w: r1(w),
    top: r1(rotY(x, BEAM.edge, BEAM.center)),
    bottom: r1(rotY(x, BASE.edge, BASE.center)),
    shade: r1(0.35 + near * 0.65),
  };
});

// Лепные зубчики по парапету ротонды
const crenels = Array.from({ length: 23 }, (_, i) => {
  const a = ((i - 11) * 7.6 * Math.PI) / 180;
  const x = ROT_C + ROT_R_X * Math.sin(a);
  const w = 1.2 + Math.cos(a) * 2.2;
  return { x: r1(x - w / 2), y: r1(rotY(x, PARAPET.edge, PARAPET.center)), w: r1(w) };
});

// Окна-иллюминаторы на башне: [смещение от оси, высота от верха цилиндра]
const portholes: [number, number][] = [
  [-17, 16],
  [0, 12],
  [17, 16],
  [-11, 36],
  [11, 36],
  [-17, 56],
  [0, 52],
  [17, 56],
  [0, 74],
];

// Круглая башня с иллюминаторами, зубцами и золотым куполом.
// top: верх цилиндра, bottom: низ (дальше её закрывает основание), s: масштаб.
function Tower({ cx, top, bottom, s }: { cx: number; top: number; bottom: number; s: number }) {
  const y = (dy: number) => r1(top + dy * s);
  return (
    <g>
      {/* Ореол купола: тихо «дышит» */}
      <ellipse className="date-breathe" cx={cx} cy={y(-32)} rx={r1(20 * s)} ry={r1(22 * s)} fill="url(#date-dome-halo)" />
      <rect x={r1(cx - 29 * s)} y={top} width={r1(58 * s)} height={r1(bottom - top)} fill="url(#date-tower)" />
      <rect x={r1(cx - 31 * s)} y={y(-3)} width={r1(62 * s)} height={r1(4 * s)} fill="#e6d3ae" />
      <path d={merlons(cx - 31 * s, y(-3), cx + 31 * s, y(-3), r1(4 * s))} fill="#e6d3ae" />
      {portholes.map(([dx, dy], i) => {
        if (top + dy * s > bottom - 6) return null;
        const squeeze = 1 - Math.abs(dx) / 40;
        return (
          <g key={i}>
            <ellipse cx={r1(cx + dx * s)} cy={y(dy)} rx={r1(3.6 * squeeze * s)} ry={r1(3.6 * s)} fill="#8d7656" />
            <ellipse
              cx={r1(cx + dx * s)}
              cy={y(dy)}
              rx={r1(2.5 * squeeze * s)}
              ry={r1(2.5 * s)}
              fill={i % 3 === 1 ? "#f7c08a" : "#9cc8f2"}
              fillOpacity="0.9"
            />
          </g>
        );
      })}
      {/* Верхний барабан с зубцами */}
      <rect x={r1(cx - 11 * s)} y={y(-19)} width={r1(22 * s)} height={r1(17 * s)} fill="url(#date-tower)" />
      <rect x={r1(cx - 12.5 * s)} y={y(-21)} width={r1(25 * s)} height={r1(3 * s)} fill="#e6d3ae" />
      <path d={merlons(cx - 12.5 * s, y(-21), cx + 12.5 * s, y(-21), r1(3 * s))} fill="#e6d3ae" />
      <ellipse cx={cx} cy={y(-11)} rx={r1(2 * s)} ry={r1(3 * s)} fill="#9cc8f2" fillOpacity="0.85" />
      {/* Золотой купол-луковка со шпилем */}
      <rect x={r1(cx - 4 * s)} y={y(-28)} width={r1(8 * s)} height={r1(5 * s)} fill="#c58f3a" />
      <path d={onion(cx, y(-27), 15 * s, 7 * s)} fill="url(#date-gold)" />
      <path d={onion(cx, y(-27), 15 * s, 7 * s)} fill="none" stroke="#fbe0a6" strokeOpacity="0.5" strokeWidth="0.5" />
      <line x1={cx} y1={y(-42)} x2={cx} y2={y(-54)} stroke="#e0a94a" strokeWidth="1" />
      <circle cx={cx} cy={y(-47)} r={r1(1.4 * s)} fill="#e0a94a" />
      <circle cx={cx} cy={y(-54)} r={r1(0.9 * s)} fill="#fbe0a6" />
    </g>
  );
}

// Синий шатёр-павильон на террасе
function Pavilion({ x, base, s }: { x: number; base: number; s: number }) {
  const h = 16 * s;
  const w = 9 * s;
  return (
    <g>
      <path d={`M${r1(x - w)} ${base} L${x} ${r1(base - h)} L${r1(x + w)} ${base} Z`} fill="#3567c2" />
      <path d={`M${x} ${r1(base - h)} L${r1(x + w)} ${base} L${r1(x + w * 0.3)} ${base} Z`} fill="#24509e" />
      <path d={`M${r1(x - w)} ${base} L${x} ${r1(base - h)} L${r1(x + w)} ${base}`} fill="none" stroke="#e6d3ae" strokeWidth="0.7" />
      <line x1={x} y1={r1(base - h)} x2={x} y2={r1(base - h - 5 * s)} stroke="#e0a94a" strokeWidth="0.8" />
      <circle cx={x} cy={r1(base - h - 3 * s)} r="0.9" fill="#e0a94a" />
    </g>
  );
}

const INK = "#0a0b1f";
const RIM = "#f7c08a";

// Человечек в профиль, лицом вправо; ноги на y = 0, рост ~29. Второго рисуем отражённым.
function Person({ x, mirror, long }: { x: number; mirror: boolean; long: boolean }) {
  return (
    <g transform={`translate(${x} ${FEET}) scale(${mirror ? -FIGURE : FIGURE} ${FIGURE})`}>
      {/* Мягкая тень под ногами */}
      <ellipse className="date-walk" cx="0" cy="0.4" rx="5.5" ry="1.1" fill="#05060f" opacity="0.5" />
      <g className="date-walk">
        <g className="date-step">
          {/* Дальняя рука висит за телом */}
          <line x1="-0.6" y1="-20" x2="-1.6" y2="-12" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="-1.7" cy="-11.4" r="1" fill={INK} />
          {/* Ноги с ботинками */}
          <g className="date-leg">
            <line x1="0" y1="-11" x2="0" y2="-1.2" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M-1 -1.6 L2.4 -1.2 Q2.8 0 2 0 L-1.1 0 Z" fill={INK} />
          </g>
          <g className="date-leg date-leg-b">
            <line x1="0" y1="-11" x2="0" y2="-1.2" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M-1 -1.6 L2.4 -1.2 Q2.8 0 2 0 L-1.1 0 Z" fill={INK} />
          </g>
          {/* Тело: у неё пальто расширяется книзу, у него куртка покороче */}
          <path
            d={
              long
                ? "M-2.4 -21.2 Q0 -22.2 2.4 -21.2 L4.2 -8.6 Q0 -7.8 -4.2 -8.6 Z"
                : "M-3 -21.6 Q0 -22.6 3 -21.6 L3 -10.4 Q0 -10 -3 -10.4 Z"
            }
            fill={INK}
            stroke={RIM}
            strokeOpacity="0.6"
            strokeWidth="0.35"
            strokeLinejoin="round"
          />
          {/* Шея, голова и причёска */}
          <rect x="-0.8" y="-23.4" width="1.6" height="2.4" fill={INK} />
          {long ? (
            <>
              {/* Длинные волосы падают на спину */}
              <path d="M-3.3 -25.8 Q-3.6 -29.6 0 -29.6 Q3.1 -29.6 3.1 -26.4 L1.2 -26.8 L-0.8 -24 L-1.6 -18.6 Q-3.4 -18.8 -3.9 -20.2 Z" fill={INK} />
              <circle cx="0.2" cy="-25.8" r="3" fill={INK} stroke={RIM} strokeOpacity="0.6" strokeWidth="0.35" />
            </>
          ) : (
            <>
              <circle cx="0.2" cy="-26.2" r="3.3" fill={INK} stroke={RIM} strokeOpacity="0.6" strokeWidth="0.35" />
              <path d="M-3.2 -26.6 Q-3 -30 0.4 -29.7 Q3 -29.4 3.4 -27.4 Q0.6 -28.4 -1.4 -27 Z" fill={INK} />
            </>
          )}
          {/* Ближняя рука с ладонью: на встрече поднимается для рукопожатия */}
          <g className="date-arm">
            <line x1="1.2" y1="-20" x2="1.2" y2="-11.4" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="1.9" y1="-19.6" x2="1.9" y2="-11.8" stroke={RIM} strokeOpacity="0.55" strokeWidth="0.3" strokeLinecap="round" />
            <ellipse cx="1.2" cy="-10.6" rx="1.05" ry="1.3" fill={INK} stroke={RIM} strokeOpacity="0.55" strokeWidth="0.3" />
          </g>
        </g>
      </g>
    </g>
  );
}

// Четырёхлучевая искорка
function sparkle(x: number, y: number, r: number) {
  const k = r * 0.22;
  return `M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`;
}

// Кусты на газоне по сторонам площади: [x, y, радиус]
const shrubs: [number, number, number][] = [
  [8, 268, 11],
  [30, 274, 9],
  [52, 270, 8],
  [14, 290, 10],
  [350, 268, 8],
  [356, 286, 9],
];

export function DateScene() {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  // Сцена встречи проигрывается один раз, когда картинка впервые на экране
  const seen = useInView(svgRef, { once: true, amount: 0.5 });
  // А тихие «дыхания» стоят, пока картинка вне экрана
  const onScreen = useInView(svgRef);
  // Поднятая рука (поворот на -72°) выносит ладонь на (10.1, -17.1) от ног:
  // двое стоят так, чтобы ладони сошлись ровно в точке встречи
  const gap = r1(10.1 * FIGURE);
  const handY = r1(FEET - 17.1 * FIGURE);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={reduced ? { duration: 0.3 } : { duration: 1.4, ease: "easeOut" }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`date-scene block h-auto w-full ${seen ? "date-go" : ""} ${onScreen ? "" : "date-paused"}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="date-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1026" />
            <stop offset="55%" stopColor="#1f1b40" />
            <stop offset="100%" stopColor="#3a2a4d" />
          </linearGradient>
          <radialGradient id="date-floodlight" cx="45%" cy="100%" r="75%">
            <stop offset="0%" stopColor="#f4a259" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="date-tower" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9a8462" />
            <stop offset="35%" stopColor="#e8d4ae" />
            <stop offset="70%" stopColor="#cdb690" />
            <stop offset="100%" stopColor="#6f5e48" />
          </linearGradient>
          <linearGradient id="date-cream" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ecdcbc" />
            <stop offset="100%" stopColor="#c9b28c" />
          </linearGradient>
          <linearGradient id="date-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a8742c" />
            <stop offset="45%" stopColor="#f2c66a" />
            <stop offset="100%" stopColor="#9b6a26" />
          </linearGradient>
          <radialGradient id="date-dome-halo">
            <stop offset="0%" stopColor="#f7c08a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f7c08a" stopOpacity="0" />
          </radialGradient>
          <pattern id="date-lattice" width="5" height="7" patternUnits="userSpaceOnUse">
            <rect width="5" height="7" fill="#2a5db4" />
            <path d="M2.5 0 L5 3.5 L2.5 7 L0 3.5 Z" fill="#3f7fd6" stroke="#a9d6ff" strokeOpacity="0.55" strokeWidth="0.4" />
          </pattern>
          <linearGradient id="date-glass-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9d6ff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#a9d6ff" stopOpacity="0.35" />
          </linearGradient>
          <radialGradient id="date-clock">
            <stop offset="0%" stopColor="#bfe3ff" />
            <stop offset="55%" stopColor="#4f8fe0" />
            <stop offset="100%" stopColor="#24509e" />
          </radialGradient>
          <linearGradient id="date-brick" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6a2e38" />
            <stop offset="100%" stopColor="#4a1f2a" />
          </linearGradient>
          <radialGradient id="date-hall" cx="50%" cy="70%" r="65%">
            <stop offset="0%" stopColor="#b8703f" />
            <stop offset="55%" stopColor="#6e3a34" />
            <stop offset="100%" stopColor="#2e1a2a" />
          </radialGradient>
          <linearGradient id="date-column" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b9a888" />
            <stop offset="40%" stopColor="#f6ecd8" />
            <stop offset="100%" stopColor="#c7b796" />
          </linearGradient>
          <linearGradient id="date-lawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#173226" />
            <stop offset="100%" stopColor="#0b1a16" />
          </linearGradient>
          <linearGradient id="date-plaza" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5d4c5c" />
            <stop offset="100%" stopColor="#2c2643" />
          </linearGradient>
          <radialGradient id="date-plaza-light" cx="58%" cy="0%" r="75%">
            <stop offset="0%" stopColor="#f7c08a" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#f7c08a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="date-door">
            <stop offset="0%" stopColor="#ffe2b0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="date-spark-glow">
            <stop offset="0%" stopColor="#ffe2b0" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#f7c08a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Небо, звёзды и тёплая подсветка снизу */}
        <rect x="0" y="0" width={W} height={H} fill="url(#date-sky)" />
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#f3e9dc"
            opacity={s.o}
            className={s.twinkle ? "date-twinkle" : undefined}
            style={s.twinkle ? { animationDelay: `${(i % 5) * 1.3}s` } : undefined}
          />
        ))}
        <rect x="0" y="40" width={W} height="160" fill="url(#date-floodlight)" />

        {/* Дальний план справа: низкое крыло, уходящее вдаль */}
        <path d="M292 150 L360 156 L360 190 L292 190 Z" fill="url(#date-cream)" />
        <path d={merlons(292, 150, 360, 156, 2.4)} fill="#e6d3ae" />
        {[304, 318, 332, 346].map((x, i) => (
          <path key={x} d={arch(x, 160 + i * 0.6, 6 - i * 0.4, 176)} fill={i % 2 ? "#f7c08a" : "#5f9ae6"} fillOpacity="0.8" />
        ))}

        {/* Синие витражи в ромбик: слева ближе и выше, справа дальше и ниже */}
        <path d="M80 100 L120 104 L120 175 L80 175 Z" fill="url(#date-lattice)" />
        <path d="M218 112 L252 115 L252 175 L218 175 Z" fill="url(#date-lattice)" />
        <g className="date-breathe" style={{ animationDelay: "-2s" }}>
          <path d="M80 100 L120 104 L120 175 L80 175 Z" fill="url(#date-glass-glow)" />
          <path d="M218 112 L252 115 L252 175 L218 175 Z" fill="url(#date-glass-glow)" />
        </g>
        <g stroke="#e6d3ae" strokeWidth="1.1">
          {[80, 93, 106, 120].map((x) => (
            <line key={x} x1={x} y1={100 + (x - 80) * 0.1} x2={x} y2="175" />
          ))}
          {[218, 229, 240, 252].map((x) => (
            <line key={x} x1={x} y1={112 + (x - 218) * 0.09} x2={x} y2="175" />
          ))}
          <line x1="80" y1="100" x2="120" y2="104" strokeWidth="2.2" />
          <line x1="218" y1="112" x2="252" y2="115" strokeWidth="2" />
        </g>
        <path d={merlons(80, 99, 120, 103, 3)} fill="#e6d3ae" />
        <path d={merlons(218, 111, 252, 114, 2.6)} fill="#e6d3ae" />

        {/* Центр: три острых щипца в ракурсе, средний выше всех, правый дальше и меньше */}
        <path d="M116 105 L224 115 L224 178 L116 178 Z" fill="url(#date-cream)" opacity="0.8" />
        <path d="M114 107 L132 65 L150 109 Z" fill="url(#date-cream)" opacity="0.8" />
        <path d="M190 113 L206 75 L222 113 Z" fill="url(#date-cream)" opacity="0.8" />
        <path d="M140 110 L168 43 L196 113 Z" fill="url(#date-cream)" opacity="0.8" />
        {/* Золотой узор по щипцам */}
        <g fill="none" stroke="#e0a94a" strokeWidth="0.8" strokeLinejoin="round" opacity="0.7">
          <path d="M119 106 L132 73 L145 108" />
          <path d="M195 113 L206 83 L217 114" />
          <path d="M145 110 L168 47 L191 112" />
          <path d="M126 97 Q132 88 138 98" />
          <path d="M200 105 Q206 97 212 106" />
          <path d="M154 71 Q160 63 168 67 Q176 64 182 72" strokeWidth="1.1" />
          <path d="M158 76 Q168 68 178 77" />
        </g>
        <path d="M140 110 L168 43 L196 113" fill="none" stroke="#8d7656" strokeWidth="0.6" />
        <path d="M114 107 L132 65 L150 109" fill="none" stroke="#8d7656" strokeWidth="0.6" />
        <path d="M190 113 L206 75 L222 113" fill="none" stroke="#8d7656" strokeWidth="0.6" />
        {/* Шпили-навершия на щипцах */}
        {[
          [132, 56, 7],
          [206, 66, 6],
          [168, 34, 10],
        ].map(([x, y, h]) => (
          <g key={x}>
            <line x1={x} y1={y} x2={x} y2={y - h} stroke="#e0a94a" strokeWidth="1" />
            <circle cx={x} cy={y - h * 0.45} r="1.4" fill="#e0a94a" />
          </g>
        ))}
        {/* Синие стрельчатые окна */}
        {[
          [126, 3.4],
          [142, 3.2],
          [196, 2.8],
          [210, 2.6],
        ].map(([x, w]) => (
          <path
            key={x}
            d={`M${x - w} 146 L${x - w} 130 Q${x} 121 ${x + w} 130 L${x + w} 146 Z`}
            fill="#5f9ae6"
            stroke="#8d7656"
            strokeWidth="0.6"
          />
        ))}

        {/* Большие синие часы-розетка в среднем щипце, чуть в ракурсе */}
        <g className="date-breathe" style={{ animationDelay: "-4s" }}>
          <ellipse cx="168" cy="104" rx="19" ry="21" fill="url(#date-dome-halo)" />
        </g>
        <ellipse cx="168" cy="104" rx="13" ry="14.5" fill="url(#date-clock)" stroke="#e0a94a" strokeWidth="2" />
        <ellipse cx="168" cy="104" rx="9" ry="10" fill="none" stroke="#e8d4ae" strokeOpacity="0.7" strokeWidth="0.6" />
        <g stroke="#e8d4ae" strokeOpacity="0.8" strokeWidth="0.7">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={r1(168 + Math.cos(a) * 10)}
                y1={r1(104 + Math.sin(a) * 11.2)}
                x2={r1(168 + Math.cos(a) * 12)}
                y2={r1(104 + Math.sin(a) * 13.4)}
              />
            );
          })}
        </g>
        <path d="M168 104 L168 96.5 M168 104 L172.5 107" stroke="#f2c66a" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="168" cy="104" r="1.3" fill="#f2c66a" />

        {/* Башни: левая ближе и крупнее, правая дальше и меньше */}
        <Tower cx={270} top={124} bottom={180} s={0.66} />
        <Tower cx={48} top={86} bottom={180} s={1.12} />

        {/* Кирпичная терраса с арками: уходит вправо, к горизонту */}
        <path d="M0 172 L360 186 L360 262 L0 268 Z" fill="url(#date-brick)" />
        <path d="M0 172 L360 186 L360 189 L0 175.4 Z" fill="#e6d3ae" />
        <path d={merlons(0, 172, 360, 186, 2.2)} fill="#e6d3ae" />
        {[
          [4, 26],
          [36, 24],
        ].map(([x, w], i) => (
          <g key={x}>
            <path d={arch(x, 186 + i, w, 268)} fill="#e6d3ae" />
            <path d={arch(x + 2.5, 189 + i, w - 5, 268)} fill={i === 1 ? "#c98a4e" : "#2a1a2a"} fillOpacity={i === 1 ? 0.8 : 1} />
          </g>
        ))}
        {/* Синий шатёр на террасе перед ближней башней */}
        <Pavilion x={24} base={173} s={1.15} />

        {/* Полукруглая колоннада-ротонда на первом плане: вход в театр */}
        <path d={rotunda.hall} fill="url(#date-hall)" />
        {/* Светящиеся двери в глубине */}
        <g className="date-breathe" style={{ animationDelay: "-6s" }}>
          <ellipse cx={MEET} cy="244" rx="70" ry="34" fill="url(#date-door)" opacity="0.55" />
        </g>
        {[
          [MEET - 9, 214, 18],
          [MEET - 52, 222, 12],
          [MEET + 40, 222, 12],
        ].map(([x, top, w]) => (
          <g key={x}>
            <path d={arch(x, top, w, rotY(x + w / 2, BASE.edge, BASE.center) - 6)} fill="#f7c08a" fillOpacity="0.75" />
            <line x1={x + w / 2} y1={top + 2} x2={x + w / 2} y2={rotY(x + w / 2, BASE.edge, BASE.center) - 6} stroke="#8a4e2e" strokeWidth="0.8" />
          </g>
        ))}
        {columns.map((c) => (
          <g key={c.x}>
            <rect x={r1(c.x - c.w / 2)} y={c.top} width={c.w} height={r1(c.bottom - c.top)} fill="url(#date-column)" opacity={c.shade} />
            <rect x={r1(c.x - c.w / 2 - 1)} y={c.top} width={r1(c.w + 2)} height="2.4" fill="#e6d3ae" opacity={c.shade} />
            <rect x={r1(c.x - c.w / 2 - 1)} y={r1(c.bottom - 2.6)} width={r1(c.w + 2)} height="2.6" fill="#d9c49e" opacity={c.shade} />
          </g>
        ))}
        <path d={rotunda.beam} fill="#6b2f3a" />
        <path d={rotCurve(CORNICE.edge + 6, CORNICE.center + 6)} fill="none" stroke="#e6d3ae" strokeOpacity="0.6" strokeWidth="0.8" />
        <path d={rotCurve(BEAM.edge, BEAM.center)} fill="none" stroke="#e6d3ae" strokeWidth="1.8" />
        <path d={rotunda.parapet} fill="#e6d3ae" />
        <path d={rotCurve(CORNICE.edge, CORNICE.center)} fill="none" stroke="#c9b28c" strokeWidth="1" />
        {crenels.map((c, i) => (
          <rect key={i} x={c.x} y={r1(c.y - 3)} width={c.w} height="3" fill="#e6d3ae" />
        ))}
        {/* Голубой купол-фонарь над ротондой, как на фото */}
        <path d={`M${MEET - 14} ${PARAPET.center - 1} Q${MEET} ${PARAPET.center - 14} ${MEET + 14} ${PARAPET.center - 1} Z`} fill="#3f7fd6" stroke="#e0a94a" strokeWidth="0.8" />
        <line x1={MEET} y1={PARAPET.center - 8} x2={MEET} y2={PARAPET.center - 14} stroke="#e0a94a" strokeWidth="0.8" />

        {/* Газон по краям, площадь и ступени перед входом */}
        <path d={`M0 268 L${ROT_L} 263 L${ROT_L} ${H} L0 ${H} Z`} fill="url(#date-lawn)" />
        <path d={`M${ROT_R} 262 L360 262 L360 ${H} L${ROT_R} ${H} Z`} fill="url(#date-lawn)" />
        <path d={`${rotCurve(BASE.edge, BASE.center)} L${ROT_R} ${H} L${ROT_L} ${H} Z`} fill="url(#date-plaza)" />
        <path d={`${rotCurve(BASE.edge, BASE.center)} L${ROT_R} ${H} L${ROT_L} ${H} Z`} fill="url(#date-plaza-light)" />
        <path d={rotCurve(BASE.edge + 4, BASE.center + 5)} fill="none" stroke="#a08a90" strokeOpacity="0.45" strokeWidth="0.8" />
        <path d={rotCurve(BASE.edge + 9, BASE.center + 11)} fill="none" stroke="#a08a90" strokeOpacity="0.3" strokeWidth="0.8" />
        {shrubs.map(([x, y, r], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.82} fill="#13291f" />
            <ellipse cx={x - r * 0.25} cy={y - r * 0.3} rx={r * 0.55} ry={r * 0.4} fill="#1f3d2c" />
          </g>
        ))}

        {/* Тёплое сияние и искорки над рукопожатием */}
        <g className="date-spark">
          <ellipse cx={MEET} cy={handY - 4} rx="26" ry="22" fill="url(#date-spark-glow)" />
          <path d={sparkle(MEET, handY - 16, 4.2)} fill="#fff1d6" />
          <path d={sparkle(MEET - 10, handY - 9, 2.4)} fill="#fbe0a6" />
          <path d={sparkle(MEET + 10.5, handY - 11, 2.6)} fill="#fbe0a6" />
        </g>

        {/* Двое: идут навстречу и пожимают руки у самого входа */}
        <Person x={MEET - gap} mirror={false} long={false} />
        <Person x={MEET + gap} mirror={true} long={true} />
      </svg>
    </motion.div>
  );
}
