"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

// Сцена из сна: лес со всех сторон, лавочка стоит среди деревьев на самом краю обрыва.
// Внизу лес и река, на том берегу городки и деревни с церковью,
// слева вдали завод, над которым всегда стоит оранжевое зарево, а перед ним лес.
// Чисто декоративная картинка: только фигуры, без текста.

// Кадр выше и уже прежнего (360x204): на телефоне лавочка, трубы и церковь крупнее
const W = 320;
const H = 220;
// Линия дальнего берега
const BANK = 96;
// Ближний край реки, дальше вниз лес под обрывом
const SHORE = 140;

// Ёлки силуэтом: [x, высота, полуширина]; основание задаётся снаружи
type Pine = [number, number, number];

function pinesPath(trees: Pine[], base: number) {
  return trees
    .map(([x, h, w]) => {
      // Ёлка из трёх ярусов, чтобы силуэт не был простым треугольником
      const t1 = base - h * 0.4;
      const t2 = base - h * 0.7;
      return `M${x - w} ${base} L${x - w * 0.5} ${t1} L${x - w * 0.8} ${t1} L${x - w * 0.35} ${t2} L${x - w * 0.6} ${t2} L${x} ${base - h} L${x + w * 0.6} ${t2} L${x + w * 0.35} ${t2} L${x + w * 0.8} ${t1} L${x + w * 0.5} ${t1} L${x + w} ${base} Z`;
    })
    .join(" ");
}

// Лиственные кроны: [x, y, радиус] кругами
type Crown = [number, number, number];

function crownsPath(crowns: Crown[]) {
  return crowns
    .map(([x, y, r]) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`)
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
  return Array.from({ length: 30 }, (_, i) => ({
    x: Math.round((50 + rand() * (W - 90)) * 10) / 10,
    y: Math.round((4 + rand() * 62) * 10) / 10,
    r: rand() < 0.2 ? 1.1 : 0.6,
    o: Math.round((0.35 + rand() * 0.4) * 100) / 100,
    twinkle: i % 3 === 0,
    delay: Math.round(rand() * 80) / 10,
  }));
})();

// Лес слева на том берегу, перед заревом: выше прежнего, трубы торчат над ним
const farLeftForest: Pine[] = Array.from({ length: 17 }, (_, i) => [
  i * 7 + 3,
  12 + ((i * 7) % 5) * 2.2,
  4.2,
]);

// Дома на том берегу: [x, y крыши (низ ската), ширина, высота конька]
type House = [number, number, number, number];

const townNear: House[] = [
  [134, 91, 8, 3.5],
  [144, 89, 9, 4],
  [155, 92, 7, 3],
  [164, 90, 9, 3.5],
  [176, 92, 7, 3],
];

const townChurch: House[] = [
  [222, 89, 8, 3.5],
  [232, 87, 9, 4],
  [256, 89, 8, 3.5],
  [266, 88, 8, 3],
];

// Окна: [x, y, мерцает ли]
const windows: [number, number, boolean][] = [
  [136.5, 93, false],
  [147, 91.5, true],
  [150.5, 91.5, false],
  [157, 94, false],
  [167, 92, true],
  [178.5, 94, false],
  [224.5, 91, false],
  [235, 89.5, true],
  [238.5, 89.5, false],
  [258.5, 91, false],
  [268.5, 90, true],
];

// Совсем далёкие огоньки деревень на втором плане
const farLights: [number, number, boolean][] = [
  [124, 87, false],
  [196, 85.5, false],
  [202, 86, true],
  [208, 85.2, false],
  [284, 84, true],
  [292, 84.6, false],
  [302, 85.4, false],
];

// Лесистые склоны по обе стороны долины, над рекой
const slopeLeft: Pine[] = [
  [4, 46, 11],
  [18, 38, 10],
  [32, 44, 11],
  [46, 32, 9],
  [60, 26, 8],
  [74, 20, 7],
  [86, 14, 6],
  [97, 10, 5],
];

const slopeRight: Pine[] = [
  [214, 10, 5],
  [225, 14, 6],
  [237, 20, 7],
  [250, 28, 8],
  [264, 36, 10],
  [279, 42, 11],
  [294, 38, 10],
  [309, 48, 12],
  [322, 44, 11],
];

// Лес внизу, под обрывом: кроны, на которые смотришь сверху
const valleyFar: Crown[] = Array.from({ length: 22 }, (_, i) => [
  i * 15 + 4,
  SHORE + 6 + ((i * 5) % 4) * 1.6,
  8 + ((i * 3) % 4) * 1.2,
]);

// Второй ряд крон пониже, ближе к обрыву: внизу сплошной лес
const valleyMid: Crown[] = Array.from({ length: 15 }, (_, i) => [
  i * 14 + 2,
  SHORE + 17 + ((i * 7) % 3) * 1.4,
  7.5 + ((i * 5) % 3) * 1.3,
]);

const valleyMidPines: Pine[] = [
  [20, 18, 5],
  [52, 22, 6],
  [88, 16, 5],
  [120, 20, 5.5],
  [158, 17, 5],
  [186, 21, 6],
];

const valleyNear: Crown[] = [
  [210, 168, 11],
  [228, 160, 12],
  [246, 166, 11],
  [262, 158, 13],
  [282, 164, 12],
  [300, 156, 13],
  [318, 162, 12],
  [222, 186, 12],
  [244, 182, 13],
  [266, 188, 12],
  [290, 180, 13],
  [312, 186, 12],
];

const valleyPines: Pine[] = [
  [216, 22, 6],
  [238, 26, 7],
  [272, 24, 6],
  [298, 28, 7],
];

// Ближние деревья, обступающие лавочку слева и справа: лес со всех сторон
const frameLeft: Pine[] = [
  [6, 196, 30],
  [34, 150, 22],
  [58, 92, 15],
];

const frameRight: Pine[] = [
  [256, 120, 17],
  [284, 172, 26],
  [316, 206, 32],
];

// Кромка обрыва: лавочка стоит у самого края, справа виден скальный срез
const LIP = "M0 168 Q30 164 64 163 Q104 161 140 160 Q170 159 192 161 L198 163";
const LEDGE = `${LIP} L204 172 L210 188 L216 204 L222 ${H} L0 ${H} Z`;
const FACE = `M192 161 L198 163 L204 172 L210 188 L216 204 L222 ${H} L236 ${H} L228 200 L222 182 L214 168 L204 161 Z`;

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
        viewBox={`0 0 ${W} ${H}`}
        className={`block h-auto w-full ${onScreen ? "" : "night-paused"}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1026" />
            <stop offset="55%" stopColor="#1a1838" />
            <stop offset="100%" stopColor="#3a2a4d" />
          </linearGradient>
          <radialGradient id="night-glow">
            <stop offset="0%" stopColor="#f4a259" stopOpacity="0.6" />
            <stop offset="45%" stopColor="#f4a259" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f4a259" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="night-plume">
            <stop offset="0%" stopColor="#f7c08a" stopOpacity="0.24" />
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
            <stop offset="100%" stopColor="#15153a" />
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
            <rect x="0" y={BANK + 2} width={W} height={SHORE - BANK} />
          </clipPath>
          <linearGradient id="night-valley" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f1c44" />
            <stop offset="100%" stopColor="#100f2a" />
          </linearGradient>
          <linearGradient id="night-ledge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0c24" />
            <stop offset="100%" stopColor="#05060f" />
          </linearGradient>
          <linearGradient id="night-face" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2a2448" />
            <stop offset="100%" stopColor="#141230" />
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
          <ellipse cx="68" cy="44" rx="28" ry="50" fill="url(#night-plume)" />
          <ellipse cx="72" cy="90" rx="96" ry="64" fill="url(#night-glow)" />
        </g>

        {/* Второй план того берега: дальние холмы с огоньками деревень */}
        <path
          d={`M96 ${BANK} Q140 84 190 86 Q236 88 270 82 Q298 78 ${W} 83 L${W} ${BANK} Z`}
          fill="#221d45"
        />
        <Lights list={farLights} size={0.9} />

        {/* Завод: корпуса и трубы */}
        <g fill="#120f2c">
          <rect x="50" y="82" width="26" height={BANK - 82} />
          <rect x="76" y="86" width="20" height={BANK - 86} />
          <rect x="57" y="56" width="5" height="28" />
          <rect x="68" y="62" width="4.5" height="22" />
          <rect x="84" y="67" width="4" height="20" />
        </g>
        {/* Огоньки на верхушках труб */}
        <circle cx="59.5" cy="55.2" r="0.9" fill="#f4a259" opacity="0.85" />
        <circle cx="70.25" cy="61.3" r="0.7" fill="#f4a259" opacity="0.6" />

        {/* Высокий лес перед заревом */}
        <path d={pinesPath(farLeftForest, BANK + 1)} fill="#0e0c26" />

        {/* Городки на том берегу и церковь */}
        <path d={`M112 ${BANK + 2} Q180 90 250 92 Q290 93 ${W} 91 L${W} ${BANK + 2} Z`} fill="#17153a" />
        <Houses houses={townNear} />
        <Houses houses={townChurch} />
        <g fill="#17153a">
          {/* Колокольня со шпилем и купол рядом */}
          <rect x="244" y="74" width="7" height={BANK - 74} />
          <path d="M243.5 74 L247.5 62 L251.5 74 Z" />
          <line x1="247.5" y1="62" x2="247.5" y2="57.5" stroke="#17153a" strokeWidth="0.7" />
          <line x1="245.6" y1="59.4" x2="249.4" y2="59.4" stroke="#17153a" strokeWidth="0.6" />
          <path d="M252 86 Q252 80.5 256 80.5 Q260 80.5 260 86 Z" />
          <rect x="252" y="86" width="8" height={BANK - 86} />
        </g>
        <rect x="246.6" y="78" width="1.8" height="2.8" fill="#f7c08a" fillOpacity="0.55" />
        <Lights list={windows} size={1.4} />

        {/* Туманная дымка над тем берегом */}
        <rect x="0" y="70" width={W} height="34" fill="url(#night-haze)" />

        {/* Река */}
        <rect x="0" y={BANK + 2} width={W} height={SHORE - BANK + 6} fill="url(#night-water)" />
        {/* Отражение зарева и огоньков */}
        <g className="night-glow">
          <ellipse cx="72" cy={BANK + 2} rx="40" ry="16" fill="url(#night-reflect)" clipPath="url(#night-water-clip)" />
          {[60, 67, 75, 82].map((x, i) => (
            <rect key={x} x={x} y={BANK + 3} width="1.4" height={14 + (i % 2) * 8} fill="url(#night-streak)" />
          ))}
        </g>
        {[138, 148, 158, 168, 179, 226, 236, 259, 269].map((x, i) => (
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
        {[108, 116, 125].map((y, i) => (
          <line
            key={y}
            x1={100 + i * 12}
            x2={250 - i * 16}
            y1={y}
            y2={y}
            stroke="#f3e9dc"
            strokeOpacity="0.07"
            strokeWidth="0.8"
          />
        ))}

        {/* Туман, медленно плывущий над рекой */}
        <g className="night-mist">
          <ellipse cx="150" cy="110" rx="110" ry="6" fill="url(#night-mist)" />
        </g>

        {/* Лесистые склоны долины по обе стороны */}
        <path d={pinesPath(slopeLeft, SHORE + 4)} fill="#0f0d29" />
        <path d={pinesPath(slopeRight, SHORE + 4)} fill="#0f0d29" />

        {/* Лес внизу под обрывом: кроны далеко внизу, в дымке */}
        <path d={crownsPath(valleyFar)} fill="url(#night-valley)" />
        <rect x="0" y={SHORE + 8} width={W} height={H - SHORE - 8} fill="#100f2a" />
        <g className="night-mist" style={{ animationDuration: "29s", animationDelay: "-9s" }}>
          <ellipse cx="170" cy={SHORE + 12} rx="120" ry="7" fill="url(#night-mist)" />
        </g>
        <path d={pinesPath(valleyMidPines, SHORE + 22)} fill="#141233" />
        <path d={crownsPath(valleyMid)} fill="#141233" />
        {/* Деревья у подножия обрыва справа: их верхушки ниже кромки */}
        <path d={pinesPath(valleyPines, 176)} fill="#0c0b22" />
        <path d={crownsPath(valleyNear)} fill="#0c0b22" />

        {/* Уступ, на котором стоит лавочка, и скальный срез обрыва */}
        <path d={FACE} fill="url(#night-face)" />
        <g stroke="#3a3260" strokeOpacity="0.6" strokeWidth="0.6" fill="none">
          <path d="M200 167 L208 168" />
          <path d="M205 178 L215 180" />
          <path d="M210 192 L221 194" />
          <path d="M215 207 L227 209" />
        </g>
        <path d={LEDGE} fill="url(#night-ledge)" />
        {/* Тёплый отсвет на самой кромке */}
        <path d={LIP} fill="none" stroke="#f7c08a" strokeOpacity="0.22" strokeWidth="0.8" />
        {/* Трава и камешки у края */}
        <g stroke="#0d0c24" strokeWidth="0.8" strokeLinecap="round">
          {[70, 74, 96, 100, 176, 180, 184].map((x, i) => (
            <line key={x} x1={x} y1={163 - (x > 150 ? 2 : 0)} x2={x + (i % 2 ? 1.5 : -1.5)} y2={158 - (x > 150 ? 2 : 0)} />
          ))}
        </g>
        <ellipse cx="186" cy="163.5" rx="4" ry="2" fill="#0d0c24" />

        {/* Лавочка на краю обрыва, вид сзади и чуть сбоку, на ней никого */}
        <g transform="translate(140 177) scale(1.3) translate(-200 -191)">
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
          {/* Тёплый контур, чтобы лавочка читалась на фоне леса внизу */}
          <g stroke="#f7c08a" strokeOpacity="0.4" strokeWidth="0.45" fill="none" strokeLinecap="round">
            <line x1="179" y1="171.5" x2="217" y2="171" />
            <line x1="179" y1="175.5" x2="217" y2="175" />
            <line x1="181" y1="170" x2="181" y2="171.5" />
            <line x1="215" y1="169.5" x2="215" y2="171" />
            <line x1="217" y1="180.3" x2="221" y2="182.3" />
          </g>
        </g>

        {/* Лес вокруг: высокие ели обступают уступ с обеих сторон */}
        <path d={pinesPath(frameRight, H + 2)} fill="#08091c" />
        <path d={crownsPath([[236, 206, 16], [222, 214, 12]])} fill="#08091c" />
        <path d={pinesPath(frameLeft, H + 2)} fill="#07081a" />
        <path d={crownsPath([[78, 210, 15], [96, 216, 11]])} fill="#07081a" />
      </svg>
    </motion.div>
  );
}
