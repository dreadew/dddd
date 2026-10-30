"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

// Сцена из сна: холм с лавочкой, за ним река, на том берегу городки и деревни,
// слева вдали завод, над которым всегда стоит оранжевое зарево.
// Чисто декоративная картинка: только фигуры, без текста.

const W = 360;
const H = 250;
// Линия дальнего берега
const BANK = 136;

// Ёлки силуэтом: [x, высота, полуширина]; основание задаётся снаружи
type Pine = [number, number, number];

function pinesPath(trees: Pine[], base: number) {
  return trees
    .map(([x, h, w]) => {
      // Ёлка из двух ярусов, чтобы силуэт не был простым треугольником
      const mid = base - h * 0.55;
      return `M${x - w} ${base} L${x - w * 0.45} ${mid} L${x - w * 0.75} ${mid} L${x} ${base - h} L${x + w * 0.75} ${mid} L${x + w * 0.45} ${mid} L${x + w} ${base} Z`;
    })
    .join(" ");
}

// Детерминированный генератор: разметка на сервере и клиенте совпадает.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const stars = (() => {
  const rand = seeded(20261030);
  return Array.from({ length: 34 }, (_, i) => ({
    x: Math.round(rand() * W * 10) / 10,
    y: Math.round((6 + rand() * 92) * 10) / 10,
    r: rand() < 0.2 ? 1.1 : 0.6,
    o: Math.round((0.35 + rand() * 0.4) * 100) / 100,
    twinkle: i % 3 === 0,
    delay: Math.round(rand() * 80) / 10,
  }));
})();

// Лес слева, перед заревом (дальний берег)
const farLeftForest: Pine[] = Array.from({ length: 18 }, (_, i) => [
  i * 7.5 + 2,
  5 + ((i * 7) % 5) * 1.6,
  3.6,
]);

// Дома на том берегу: [x, y крыши (низ ската), ширина, высота конька]
type House = [number, number, number, number];

const townNear: House[] = [
  [146, 130, 7, 3],
  [155, 128, 8, 3.5],
  [165, 131, 6, 2.5],
  [173, 129, 8, 3],
  [184, 131, 6, 2.5],
  [192, 129, 7, 3],
];

const townChurch: House[] = [
  [244, 127, 7, 3],
  [253, 125, 8, 3.5],
  [272, 127, 7, 3],
  [281, 125, 8, 3],
  [291, 128, 6, 2.5],
];

// Окна: [x, y, мерцает ли]
const windows: [number, number, boolean][] = [
  [148.5, 132, false],
  [157.5, 130.5, true],
  [160, 130.5, false],
  [167, 133, false],
  [175.5, 131, true],
  [186, 133, false],
  [194, 131, true],
  [246.5, 129.5, false],
  [255.5, 127.5, true],
  [258.5, 127.5, false],
  [274.5, 129.5, false],
  [283.5, 127.5, true],
  [293, 130.5, false],
];

// Совсем далёкие огоньки деревень на втором плане
const farLights: [number, number, boolean][] = [
  [128, 126.5, false],
  [134, 127, true],
  [214, 124.5, false],
  [220, 125, false],
  [226, 124.2, true],
  [312, 122.5, false],
  [318, 123, true],
  [326, 122.4, false],
  [340, 123.5, false],
];

// Лес вокруг холма: ближний берег слева и справа
const shoreLeft: Pine[] = [
  [6, 34, 9],
  [20, 26, 8],
  [33, 38, 10],
  [48, 28, 8],
  [62, 22, 7],
  [76, 30, 8],
  [92, 20, 7],
  [106, 15, 6],
  [118, 10, 5],
];

const shoreRight: Pine[] = [
  [262, 10, 5],
  [274, 15, 6],
  [288, 22, 7],
  [302, 30, 8],
  [316, 24, 8],
  [330, 36, 10],
  [345, 28, 9],
  [358, 40, 10],
];

// Ближние ёлки на склонах холма
const hillLeft: Pine[] = [
  [-2, 64, 15],
  [22, 50, 13],
  [44, 40, 11],
];

const hillRight: Pine[] = [
  [318, 42, 11],
  [340, 56, 14],
  [362, 66, 15],
];

// Кадр чуть подрезан сверху и снизу, чтобы глава с текстом помещалась на экране телефона
const VIEW = `0 16 ${W} 204`;

const HILL = `M0 ${H} L0 212 Q70 196 140 190 Q190 186 236 189 Q300 194 ${W} 208 L${W} ${H} Z`;
const HILL_RIM = `M0 212 Q70 196 140 190 Q190 186 236 189 Q300 194 ${W} 208`;

function Houses({ houses }: { houses: House[] }) {
  return (
    <>
      {houses.map(([x, y, w, roof], i) => (
        <path
          key={i}
          d={`M${x} ${BANK + 2} L${x} ${y} L${x + w / 2} ${y - roof} L${x + w} ${y} L${x + w} ${BANK + 2} Z`}
          fill="#17153a"
        />
      ))}
    </>
  );
}

function Lights({ list, size }: { list: [number, number, boolean][]; size: number }) {
  return (
    <>
      {list.map(([x, y, flicker], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={size}
          height={size}
          fill="#f7c08a"
          fillOpacity="0.75"
          className={flicker ? "night-twinkle" : undefined}
          style={flicker ? { animationDelay: `${(i % 5) * 1.4}s` } : undefined}
        />
      ))}
    </>
  );
}

export function DreamScene() {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const onScreen = useInView(svgRef);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={reduced ? { duration: 0.3 } : { duration: 1.8, delay: 0.2, ease: "easeOut" }}
    >
      <svg
        ref={svgRef}
        viewBox={VIEW}
        className={`block h-auto w-full ${onScreen ? "" : "night-paused"}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1026" />
            <stop offset="45%" stopColor="#1a1838" />
            <stop offset="100%" stopColor="#3a2a4d" />
          </linearGradient>
          <radialGradient id="night-glow">
            <stop offset="0%" stopColor="#f4a259" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#f4a259" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="night-plume">
            <stop offset="0%" stopColor="#f7c08a" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="night-star-halo">
            <stop offset="0%" stopColor="#f3e9dc" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f3e9dc" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="night-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2a4d" stopOpacity="0" />
            <stop offset="70%" stopColor="#4a3a5e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3a2a4d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="night-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2350" />
            <stop offset="100%" stopColor="#11122f" />
          </linearGradient>
          <radialGradient id="night-reflect">
            <stop offset="0%" stopColor="#f4a259" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="night-streak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7c08a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f7c08a" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="night-mist">
            <stop offset="0%" stopColor="#f3e9dc" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#f3e9dc" stopOpacity="0" />
          </radialGradient>
          <clipPath id="night-water-clip">
            <rect x="0" y={BANK + 2} width={W} height={H - BANK} />
          </clipPath>
          <linearGradient id="night-hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#131130" />
            <stop offset="100%" stopColor="#07081a" />
          </linearGradient>
        </defs>

        {/* Небо */}
        <rect x="0" y="0" width={W} height={H} fill="url(#night-sky)" />

        {/* Звёзды: во сне они мягче и чуть размыты */}
        {stars.map((s, i) => (
          <g
            key={i}
            className={s.twinkle ? "night-twinkle" : undefined}
            style={s.twinkle ? { animationDelay: `${s.delay}s`, animationDuration: "7s" } : undefined}
          >
            {s.r > 1 && <circle cx={s.x} cy={s.y} r="3.2" fill="url(#night-star-halo)" />}
            <circle cx={s.x} cy={s.y} r={s.r} fill="#f3e9dc" opacity={s.o} />
          </g>
        ))}

        {/* Зарево над заводом слева: медленно «дышит» */}
        <g className="night-glow">
          <ellipse cx="46" cy="70" rx="30" ry="58" fill="url(#night-plume)" />
          <ellipse cx="50" cy="124" rx="110" ry="80" fill="url(#night-glow)" />
        </g>

        {/* Второй план того берега: дальние холмы с огоньками деревень */}
        <path
          d={`M100 ${BANK} Q150 122 210 125 Q260 128 300 121 Q335 117 ${W} 122 L${W} ${BANK} Z`}
          fill="#221d45"
        />
        <Lights list={farLights} size={0.9} />

        {/* Завод: корпуса и трубы */}
        <g fill="#120f2c">
          <rect x="28" y="119" width="28" height={BANK - 119} />
          <rect x="56" y="123" width="22" height={BANK - 123} />
          <path d={`M78 ${BANK} L78 126 L84 123 L84 126 L90 123 L90 ${BANK} Z`} />
          <rect x="35" y="94" width="4.5" height="26" />
          <rect x="45" y="99" width="4" height="21" />
          <rect x="62" y="104" width="3.5" height="20" />
        </g>
        {/* Огонёк на верхушке трубы */}
        <circle cx="37.25" cy="93.2" r="0.8" fill="#f4a259" opacity="0.8" />
        {/* Пара светящихся окон цеха */}
        <rect x="31" y="124" width="1.5" height="1.2" fill="#f7c08a" fillOpacity="0.7" />
        <rect x="59" y="127" width="1.5" height="1.2" fill="#f7c08a" fillOpacity="0.6" />

        {/* Лес перед заревом */}
        <path d={pinesPath(farLeftForest, BANK + 1)} fill="#0e0c26" />

        {/* Городки на том берегу и церковь */}
        <path d={`M120 ${BANK + 2} Q200 129 280 131 Q330 132 ${W} 130 L${W} ${BANK + 2} Z`} fill="#17153a" />
        <Houses houses={townNear} />
        <Houses houses={townChurch} />
        <g fill="#17153a">
          {/* Колокольня со шпилем и купол рядом */}
          <rect x="263" y="114" width="6" height={BANK - 114} />
          <path d="M262.5 114 L266 104 L269.5 114 Z" />
          <line x1="266" y1="104" x2="266" y2="100.5" stroke="#17153a" strokeWidth="0.6" />
        </g>
        <rect x="265.2" y="117" width="1.6" height="2.4" fill="#f7c08a" fillOpacity="0.55" />
        <Lights list={windows} size={1.3} />

        {/* Туманная дымка над тем берегом */}
        <rect x="0" y="104" width={W} height="36" fill="url(#night-haze)" />

        {/* Река */}
        <rect x="0" y={BANK + 2} width={W} height={192 - BANK} fill="url(#night-water)" />
        {/* Отражение зарева и огоньков */}
        <g className="night-glow">
          <ellipse cx="52" cy={BANK + 2} rx="40" ry="16" fill="url(#night-reflect)" clipPath="url(#night-water-clip)" />
          {[40, 47, 55, 62].map((x, i) => (
            <rect key={x} x={x} y={BANK + 3} width="1.4" height={14 + (i % 2) * 8} fill="url(#night-streak)" />
          ))}
        </g>
        {[150, 158, 166, 175, 186, 194, 248, 256, 275, 284].map((x, i) => (
          <rect
            key={x}
            x={x}
            y={BANK + 4}
            width="0.8"
            height={6 + (i % 3) * 3}
            fill="#f7c08a"
            fillOpacity="0.22"
          />
        ))}
        {[146, 154, 163, 172].map((y, i) => (
          <line
            key={y}
            x1={90 + i * 14}
            x2={300 - i * 18}
            y1={y}
            y2={y}
            stroke="#f3e9dc"
            strokeOpacity="0.07"
            strokeWidth="0.8"
          />
        ))}

        {/* Туман, медленно плывущий над рекой */}
        <g className="night-mist">
          <ellipse cx="150" cy="146" rx="120" ry="7" fill="url(#night-mist)" />
        </g>
        <g className="night-mist" style={{ animationDuration: "29s", animationDelay: "-9s" }}>
          <ellipse cx="250" cy="160" rx="110" ry="6" fill="url(#night-mist)" />
        </g>

        {/* Лес на ближнем берегу вокруг холма */}
        <path d={pinesPath(shoreLeft, 196)} fill="#0c0b22" />
        <path d={pinesPath(shoreRight, 196)} fill="#0c0b22" />
        <rect x="0" y="186" width={W} height="10" fill="#0c0b22" />

        {/* Холм с едва заметным тёплым краем */}
        <path d={HILL} fill="url(#night-hill)" />
        <path d={HILL_RIM} fill="none" stroke="#f7c08a" strokeOpacity="0.16" strokeWidth="0.8" />
        {/* Тропинка к лавочке */}
        <path
          d="M118 250 Q140 226 168 210 Q184 200 192 193"
          fill="none"
          stroke="#f3e9dc"
          strokeOpacity="0.06"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Лавочка на вершине, вид сзади и чуть сбоку, на ней никого; чуть увеличена, чтобы читалась на телефоне */}
        <g transform="translate(198 190) scale(1.3) translate(-198 -190)">
          <g stroke="#06071a" strokeLinecap="round" fill="none">
            {/* Ножки */}
            <line x1="181" y1="179" x2="180.5" y2="190" strokeWidth="1.6" />
            <line x1="215" y1="179" x2="215.5" y2="189" strokeWidth="1.6" />
            <line x1="185" y1="183" x2="186" y2="191.5" strokeWidth="1.3" />
            <line x1="219" y1="182.5" x2="220" y2="190.5" strokeWidth="1.3" />
            {/* Спинка из двух реек */}
            <line x1="179" y1="172.5" x2="217" y2="172" strokeWidth="2" />
            <line x1="179" y1="176.5" x2="217" y2="176" strokeWidth="2" />
            {/* Столбики спинки */}
            <line x1="181" y1="171" x2="181" y2="181" strokeWidth="1.6" />
            <line x1="215" y1="170.5" x2="215" y2="181" strokeWidth="1.6" />
            {/* Сиденье, уходящее вперёд, и подлокотник */}
            <path d="M179 181 L217 180.5 L221 182.5 L184 183.2 Z" fill="#06071a" strokeWidth="0.8" />
            <line x1="215" y1="175.5" x2="219.5" y2="178" strokeWidth="1.2" />
          </g>
          {/* Тёплый контур, чтобы лавочка читалась на фоне воды */}
          <g stroke="#f7c08a" strokeOpacity="0.32" strokeWidth="0.45" fill="none" strokeLinecap="round">
            <line x1="179" y1="171.5" x2="217" y2="171" />
            <line x1="179" y1="175.5" x2="217" y2="175" />
            <line x1="181" y1="170" x2="181" y2="171.5" />
            <line x1="215" y1="169.5" x2="215" y2="171" />
          </g>
        </g>

        {/* Ёлки на склонах холма */}
        <path d={pinesPath(hillLeft, 230)} fill="#08091c" />
        <path d={pinesPath(hillRight, 228)} fill="#08091c" />
      </svg>
    </motion.div>
  );
}
