"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

// Первое свидание: сказочный театр, у которого мы встретились, ночью,
// и двое маленьких человечков, которые идут навстречу и пожимают руки.
// Чисто декоративная картинка: только фигуры, без текста.

const W = 360;
const H = 232;
// Низ здания: дальше газон и площадь
const GROUND = 190;
// Верх кирпичной террасы, на которой стоят башни и центр
const TERRACE = 150;
// Где стоят ноги человечков
const FEET = 222;

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
  return Array.from({ length: 22 }, (_, i) => ({
    x: Math.round(rand() * W * 10) / 10,
    y: Math.round((4 + rand() * 50) * 10) / 10,
    r: rand() < 0.25 ? 0.9 : 0.55,
    o: Math.round((0.35 + rand() * 0.45) * 100) / 100,
    twinkle: i % 4 === 0,
  }));
})();

// Луковка купола: основание на y = base, высота h, полуширина w
function onion(cx: number, base: number, h: number, w: number) {
  return `M${cx - w * 0.55} ${base} C${cx - w * 1.25} ${base - h * 0.3} ${cx - w * 0.85} ${base - h * 0.62} ${cx} ${base - h} C${cx + w * 0.85} ${base - h * 0.62} ${cx + w * 1.25} ${base - h * 0.3} ${cx + w * 0.55} ${base} Z`;
}

// Зубцы поверху башни: ряд прямоугольничков
function merlons(x0: number, x1: number, y: number, size: number) {
  const n = Math.max(2, Math.round((x1 - x0) / (size * 2)));
  const step = (x1 - x0 - size) / (n - 1);
  return Array.from({ length: n }, (_, i) => `M${x0 + i * step} ${y} h${size} v${-size} h${-size} Z`).join(" ");
}

// Арка с полукруглым верхом
function arch(x: number, top: number, w: number, bottom: number) {
  const r = w / 2;
  return `M${x} ${bottom} L${x} ${top + r} A${r} ${r} 0 0 1 ${x + w} ${top + r} L${x + w} ${bottom} Z`;
}

// Ротонда спереди: кривая, у которой середина ближе к зрителю и потому выше
const ROT_L = 112;
const ROT_R = 248;
function rotY(x: number, edge: number, bulge: number) {
  const t = (x - ROT_L) / (ROT_R - ROT_L);
  return edge - 2 * t * (1 - t) * bulge;
}
const rotunda = {
  roofTop: `M${ROT_L} 150 Q180 138 ${ROT_R} 150`,
  band: `M${ROT_L} 150 Q180 138 ${ROT_R} 150 L${ROT_R} 161 Q180 149 ${ROT_L} 161 Z`,
  hall: `M${ROT_L} 161 Q180 149 ${ROT_R} 161 L${ROT_R} ${GROUND} Q180 ${GROUND - 8} ${ROT_L} ${GROUND} Z`,
};
const columns = [118, 132, 148, 166, 180, 194, 212, 228, 242];

// Окна-иллюминаторы на башне: [смещение от оси, y]
const portholes: [number, number][] = [
  [-17, 84],
  [0, 80],
  [17, 84],
  [-11, 104],
  [11, 104],
  [-17, 124],
  [0, 120],
  [17, 124],
  [0, 140],
];

// Синие шатры-павильоны на террасе
const pavilions = [104, 136, 224, 256];

// Арки в кирпичном основании по бокам от ротонды
const sideArches = [6, 32, 58, 84, 258, 284, 310, 336];

// Кусты на газоне: [x, y, радиус]
const shrubs: [number, number, number][] = [
  [10, 198, 9],
  [30, 202, 8],
  [56, 198, 10],
  [84, 203, 8],
  [106, 197, 6],
  [254, 197, 6],
  [276, 203, 8],
  [304, 198, 10],
  [330, 202, 8],
  [352, 198, 9],
  [18, 222, 7],
  [342, 222, 7],
];

function Tower({ cx }: { cx: number }) {
  return (
    <g>
      {/* Ореол купола: тихо «дышит» */}
      <ellipse className="date-breathe" cx={cx} cy="34" rx="20" ry="22" fill="url(#date-dome-halo)" />
      {/* Основной цилиндр */}
      <rect x={cx - 29} y="66" width="58" height={TERRACE - 66} fill="url(#date-tower)" />
      <rect x={cx - 31} y="63" width="62" height="4" fill="#e6d3ae" />
      <path d={merlons(cx - 31, cx + 31, 63, 4)} fill="#e6d3ae" />
      {/* Иллюминаторы */}
      {portholes.map(([dx, y], i) => {
        const squeeze = 1 - Math.abs(dx) / 40;
        return (
          <g key={i}>
            <ellipse cx={cx + dx} cy={y} rx={3.6 * squeeze} ry="3.6" fill="#8d7656" />
            <ellipse
              cx={cx + dx}
              cy={y}
              rx={2.5 * squeeze}
              ry="2.5"
              fill={i % 3 === 1 ? "#f7c08a" : "#9cc8f2"}
              fillOpacity="0.9"
            />
          </g>
        );
      })}
      {/* Верхний барабан с зубцами */}
      <rect x={cx - 11} y="47" width="22" height="17" fill="url(#date-tower)" />
      <rect x={cx - 12.5} y="45" width="25" height="3" fill="#e6d3ae" />
      <path d={merlons(cx - 12.5, cx + 12.5, 45, 3)} fill="#e6d3ae" />
      <ellipse cx={cx} cy="55" rx="2" ry="3" fill="#9cc8f2" fillOpacity="0.85" />
      {/* Золотой купол-луковка со шпилем */}
      <rect x={cx - 4} y="38" width="8" height="5" fill="#c58f3a" />
      <path d={onion(cx, 39, 15, 7)} fill="url(#date-gold)" />
      <path d={onion(cx, 39, 15, 7)} fill="none" stroke="#fbe0a6" strokeOpacity="0.5" strokeWidth="0.5" />
      <line x1={cx} y1="24" x2={cx} y2="12" stroke="#e0a94a" strokeWidth="1" />
      <circle cx={cx} cy="19" r="1.4" fill="#e0a94a" />
      <circle cx={cx} cy="12" r="0.9" fill="#fbe0a6" />
    </g>
  );
}

// Человечек в профиль, лицом вправо; ноги на y = 0. Второго рисуем отражённым.
function Person({ x, mirror, long }: { x: number; mirror: boolean; long: boolean }) {
  return (
    <g transform={`translate(${x} ${FEET}) scale(${mirror ? -1 : 1} 1)`}>
      {/* Мягкая тень под ногами */}
      <ellipse className="date-walk" cx="0" cy="0.6" rx="5" ry="1.1" fill="#05060f" opacity="0.45" />
      <g className="date-walk">
        <g className="date-step">
          {/* Дальняя рука висит за телом */}
          <line x1="-0.6" y1="-20" x2="-1.4" y2="-11.5" stroke="#0a0b1f" strokeWidth="1.7" strokeLinecap="round" />
          {/* Ноги */}
          <line className="date-leg" x1="0" y1="-11" x2="0" y2="-0.8" stroke="#0a0b1f" strokeWidth="2.3" strokeLinecap="round" />
          <line className="date-leg date-leg-b" x1="0" y1="-11" x2="0" y2="-0.8" stroke="#0a0b1f" strokeWidth="2.3" strokeLinecap="round" />
          {/* Тело: у одной фигурки силуэт чуть расширяется книзу, как пальто */}
          <path
            d={long ? "M-2.6 -21 Q0 -22 2.6 -21 L3.8 -10 L-3.8 -10 Z" : "M-3 -21.5 Q0 -22.5 3 -21.5 L2.8 -10.5 L-2.8 -10.5 Z"}
            fill="#0a0b1f"
            stroke="#f7c08a"
            strokeOpacity="0.55"
            strokeWidth="0.45"
            strokeLinejoin="round"
          />
          {/* Голова и причёска */}
          {long ? (
            <>
              <path d="M-3.4 -25.6 Q-3.6 -29.4 0 -29.4 Q3 -29.4 3 -26 L1 -26 L-1.2 -19.5 L-3.6 -19.5 Z" fill="#0a0b1f" />
              <circle cx="0" cy="-25.6" r="3.1" fill="#0a0b1f" stroke="#f7c08a" strokeOpacity="0.55" strokeWidth="0.45" />
            </>
          ) : (
            <circle cx="0" cy="-26.2" r="3.5" fill="#0a0b1f" stroke="#f7c08a" strokeOpacity="0.55" strokeWidth="0.45" />
          )}
          {/* Ближняя рука: на встрече поднимается для рукопожатия */}
          <line className="date-arm" x1="1.2" y1="-20" x2="1.2" y2="-11" stroke="#0a0b1f" strokeWidth="1.8" strokeLinecap="round" />
          <line className="date-arm" x1="1.2" y1="-20" x2="1.2" y2="-11" stroke="#f7c08a" strokeOpacity="0.4" strokeWidth="0.4" strokeLinecap="round" />
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

export function DateScene() {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  // Сцена встречи проигрывается один раз, когда картинка впервые на экране
  const seen = useInView(svgRef, { once: true, amount: 0.5 });
  // А тихие «дыхания» стоят, пока картинка вне экрана
  const onScreen = useInView(svgRef);

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
            <stop offset="60%" stopColor="#1f1b40" />
            <stop offset="100%" stopColor="#3a2a4d" />
          </linearGradient>
          <radialGradient id="date-floodlight" cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="#f4a259" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="date-tower" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8f7a5c" />
            <stop offset="35%" stopColor="#e8d4ae" />
            <stop offset="65%" stopColor="#d6c09a" />
            <stop offset="100%" stopColor="#7d6a50" />
          </linearGradient>
          <linearGradient id="date-cream" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9c49e" />
            <stop offset="100%" stopColor="#ecdcbc" />
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
          <pattern id="date-lattice" width="6" height="8" patternUnits="userSpaceOnUse">
            <rect width="6" height="8" fill="#2a5db4" />
            <path d="M3 0 L6 4 L3 8 L0 4 Z" fill="#3f7fd6" stroke="#a9d6ff" strokeOpacity="0.55" strokeWidth="0.45" />
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
          <linearGradient id="date-hall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2032" />
            <stop offset="100%" stopColor="#6a3a33" />
          </linearGradient>
          <linearGradient id="date-lawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#173226" />
            <stop offset="100%" stopColor="#0b1a16" />
          </linearGradient>
          <linearGradient id="date-plaza" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a4a5a" />
            <stop offset="100%" stopColor="#2c2643" />
          </linearGradient>
          <radialGradient id="date-plaza-light" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#f7c08a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f7c08a" stopOpacity="0" />
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
        <rect x="0" y="40" width={W} height={TERRACE - 40} fill="url(#date-floodlight)" />

        {/* Синие витражи в ромбик между башнями и центром */}
        <rect x="90" y="86" width="40" height={TERRACE - 86} fill="url(#date-lattice)" />
        <rect x="230" y="86" width="40" height={TERRACE - 86} fill="url(#date-lattice)" />
        <g className="date-breathe" style={{ animationDelay: "-2s" }}>
          <rect x="90" y="86" width="40" height={TERRACE - 86} fill="url(#date-glass-glow)" />
          <rect x="230" y="86" width="40" height={TERRACE - 86} fill="url(#date-glass-glow)" />
        </g>
        <g stroke="#e6d3ae" strokeWidth="1.2">
          {[90, 103.3, 116.6, 130, 230, 243.3, 256.6, 270].map((x) => (
            <line key={x} x1={x} y1="86" x2={x} y2={TERRACE} />
          ))}
          <line x1="90" y1="86" x2="130" y2="86" strokeWidth="2.4" />
          <line x1="230" y1="86" x2="270" y2="86" strokeWidth="2.4" />
        </g>
        <path d={merlons(90, 130, 85, 3)} fill="#e6d3ae" />
        <path d={merlons(230, 270, 85, 3)} fill="#e6d3ae" />

        {/* Центр: три острых щипца, средний выше всех */}
        <rect x="128" y="84" width="104" height={TERRACE - 84} fill="url(#date-cream)" />
        <path d="M126 86 L147 44 L168 86 Z" fill="url(#date-cream)" />
        <path d="M192 86 L213 44 L234 86 Z" fill="url(#date-cream)" />
        <path d="M152 88 L180 26 L208 88 Z" fill="url(#date-cream)" />
        {/* Золотой узор по щипцам */}
        <g fill="none" stroke="#e0a94a" strokeWidth="1" strokeLinejoin="round">
          <path d="M131 84 L147 52 L163 84" />
          <path d="M197 84 L213 52 L229 84" />
          <path d="M157 84 L180 35 L203 84" />
          <path d="M141 74 Q147 64 153 74" />
          <path d="M207 74 Q213 64 219 74" />
          <path d="M166 62 Q172 54 180 58 Q188 54 194 62" strokeWidth="1.3" />
          <path d="M170 66 Q180 58 190 66" />
        </g>
        <path d="M152 88 L180 26 L208 88" fill="none" stroke="#8d7656" strokeWidth="0.8" />
        <path d="M126 86 L147 44 L168 86" fill="none" stroke="#8d7656" strokeWidth="0.8" />
        <path d="M192 86 L213 44 L234 86" fill="none" stroke="#8d7656" strokeWidth="0.8" />
        {/* Шпили-навершия на щипцах */}
        {[
          [147, 44, 7],
          [213, 44, 7],
          [180, 26, 10],
        ].map(([x, y, h]) => (
          <g key={x}>
            <line x1={x} y1={y} x2={x} y2={y - h} stroke="#e0a94a" strokeWidth="1" />
            <circle cx={x} cy={y - h * 0.45} r="1.4" fill="#e0a94a" />
          </g>
        ))}
        {/* Синие стрельчатые окна по сторонам */}
        {[140, 154, 206, 220].map((x) => (
          <path key={x} d={`M${x - 3} 118 L${x - 3} 106 Q${x} 99 ${x + 3} 106 L${x + 3} 118 Z`} fill="#5f9ae6" stroke="#8d7656" strokeWidth="0.6" />
        ))}

        {/* Большие синие часы-розетка в среднем щипце */}
        <g className="date-breathe" style={{ animationDelay: "-4s" }}>
          <circle cx="180" cy="86" r="21" fill="url(#date-dome-halo)" />
        </g>
        <circle cx="180" cy="86" r="15" fill="url(#date-clock)" stroke="#e0a94a" strokeWidth="2" />
        <circle cx="180" cy="86" r="10.5" fill="none" stroke="#e8d4ae" strokeOpacity="0.7" strokeWidth="0.6" />
        <g stroke="#e8d4ae" strokeOpacity="0.8" strokeWidth="0.7">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={180 + Math.cos(a) * 11.5}
                y1={86 + Math.sin(a) * 11.5}
                x2={180 + Math.cos(a) * 14}
                y2={86 + Math.sin(a) * 14}
              />
            );
          })}
        </g>
        <path d="M180 86 L180 78 M180 86 L185 89" stroke="#f2c66a" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="180" cy="86" r="1.3" fill="#f2c66a" />

        {/* Две круглые башни с иллюминаторами, зубцами и золотыми куполами */}
        <Tower cx={62} />
        <Tower cx={298} />

        {/* Синие шатры на террасе */}
        {pavilions.map((x) => (
          <g key={x}>
            <path d={`M${x - 9} ${TERRACE + 1} L${x} ${TERRACE - 15} L${x + 9} ${TERRACE + 1} Z`} fill="#3567c2" />
            <path d={`M${x} ${TERRACE - 15} L${x + 9} ${TERRACE + 1} L${x + 3} ${TERRACE + 1} Z`} fill="#24509e" />
            <path d={`M${x - 9} ${TERRACE + 1} L${x} ${TERRACE - 15} L${x + 9} ${TERRACE + 1}`} fill="none" stroke="#e6d3ae" strokeWidth="0.7" />
            <line x1={x} y1={TERRACE - 15} x2={x} y2={TERRACE - 20} stroke="#e0a94a" strokeWidth="0.8" />
            <circle cx={x} cy={TERRACE - 18} r="0.9" fill="#e0a94a" />
          </g>
        ))}

        {/* Кирпичное основание с арками */}
        <rect x="0" y={TERRACE} width={W} height={GROUND - TERRACE} fill="#5e2833" />
        <rect x="0" y={TERRACE} width={W} height="3" fill="#e6d3ae" />
        <path d={merlons(0, W, TERRACE, 2)} fill="#e6d3ae" />
        <rect x="0" y={TERRACE + 6} width={W} height="1" fill="#7a3a42" />
        {sideArches.map((x, i) => (
          <g key={x}>
            <path d={arch(x, 160, 18, GROUND)} fill="#e6d3ae" />
            <path
              d={arch(x + 2, 162, 14, GROUND)}
              fill={i % 3 === 1 ? "#c98a4e" : "#2a1a2a"}
              fillOpacity={i % 3 === 1 ? 0.75 : 1}
            />
          </g>
        ))}

        {/* Полукруглая колоннада-ротонда спереди */}
        <path d={rotunda.hall} fill="url(#date-hall)" />
        <g className="date-breathe" style={{ animationDelay: "-6s" }}>
          <ellipse cx="180" cy="176" rx="50" ry="12" fill="#f4a259" fillOpacity="0.22" />
        </g>
        {columns.map((x) => {
          const top = rotY(x, 161, 6);
          const bottom = rotY(x, GROUND, 4);
          const near = 1 - Math.abs(x - 180) / 90;
          const w = 2.4 + near * 1.6;
          return (
            <g key={x}>
              <rect x={x - w / 2} y={top} width={w} height={bottom - top} fill="#efe3cc" />
              <rect x={x - w / 2 - 0.6} y={top} width={w + 1.2} height="1.4" fill="#d9c49e" />
            </g>
          );
        })}
        <path d={rotunda.band} fill="#6b2f3a" />
        <path d={rotunda.roofTop} fill="none" stroke="#e6d3ae" strokeWidth="2.2" />
        <path d={`M${ROT_L} 158 Q180 146 ${ROT_R} 158`} fill="none" stroke="#e6d3ae" strokeOpacity="0.55" strokeWidth="0.6" />

        {/* Газон, площадь перед входом и круглые кусты */}
        <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="url(#date-lawn)" />
        <path d={`M126 ${GROUND} Q180 ${GROUND - 4} 234 ${GROUND} L300 ${H} L60 ${H} Z`} fill="url(#date-plaza)" />
        <path d={`M126 ${GROUND} Q180 ${GROUND - 4} 234 ${GROUND} L300 ${H} L60 ${H} Z`} fill="url(#date-plaza-light)" />
        {shrubs.map(([x, y, r], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.82} fill="#13291f" />
            <ellipse cx={x - r * 0.25} cy={y - r * 0.3} rx={r * 0.55} ry={r * 0.4} fill="#1f3d2c" />
          </g>
        ))}

        {/* Тёплое сияние и искорки над рукопожатием */}
        <g className="date-spark">
          <ellipse cx="180" cy="196" rx="20" ry="16" fill="url(#date-spark-glow)" />
          <path d={sparkle(180, 188, 3.2)} fill="#fff1d6" />
          <path d={sparkle(173, 193, 1.8)} fill="#fbe0a6" />
          <path d={sparkle(187.5, 192, 2)} fill="#fbe0a6" />
        </g>

        {/* Двое: идут навстречу и пожимают руки */}
        <Person x={170} mirror={false} long={false} />
        <Person x={190} mirror={true} long={true} />
      </svg>
    </motion.div>
  );
}
