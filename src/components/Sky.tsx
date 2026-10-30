"use client";

type Star = { x: number; y: number; size: number; delay: number; duration: number };

// Детерминированный генератор, чтобы звёзды на сервере и клиенте совпадали.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const STAR_COUNT = 48;

const stars: Star[] = (() => {
  const rand = seeded(20261030);
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.round(rand() * 1000) / 10,
    y: Math.round(rand() * 700) / 10,
    size: rand() < 0.15 ? 2.5 : rand() < 0.5 ? 1.5 : 1,
    delay: Math.round(rand() * 60) / 10,
    duration: 3 + Math.round(rand() * 40) / 10,
  }));
})();

const LIGHT_COUNT = 14;

const lights = Array.from({ length: LIGHT_COUNT }, (_, i) => ({
  x: 4 + (i * 92) / (LIGHT_COUNT - 1),
  warm: i % 3 !== 1,
}));

export function Sky() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b1026_0%,#1a1838_55%,#3a2a4d_100%)]" />

      {stars.map((star, i) => (
        <span
          key={i}
          // Под prefers-reduced-motion мерцание выключает CSS (globals.css): так разметка
          // на сервере и клиенте совпадает и нет ошибки гидрации.
          className="star-twinkle absolute rounded-full bg-[#f3e9dc]"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      {/* Огни набережной: линия фонарей и их отражение в воде */}
      <div className="absolute inset-x-0 bottom-0 h-[22vh]">
        <div className="absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(ellipse_at_50%_100%,rgb(244_162_89/0.28),transparent_70%)]" />
        <div className="absolute inset-x-0 top-[38%] h-px bg-[#f7c08a]/25" />
        {lights.map((light, i) => (
          <span key={i}>
            <span
              className="absolute size-1.5 -translate-x-1/2 rounded-full shadow-[0_0_10px_3px_rgb(244_162_89/0.55)]"
              style={{
                left: `${light.x}%`,
                top: "calc(38% - 3px)",
                background: light.warm ? "#f7c08a" : "#f3e9dc",
              }}
            />
            <span
              className="absolute h-8 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#f4a259]/40 to-transparent blur-[1px]"
              style={{ left: `${light.x}%`, top: "calc(38% + 4px)" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
