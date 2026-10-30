export type Box = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };

export function overlaps(a: Box, b: Box, gap = 0): boolean {
  return (
    a.x < b.x + b.w + gap &&
    b.x < a.x + a.w + gap &&
    a.y < b.y + b.h + gap &&
    b.y < a.y + a.h + gap
  );
}

// Допустимый диапазон левого/верхнего края по одной оси. Если кнопка шире области,
// возвращаем начало области: позиция всё равно внутри bounds, без исключений.
function axis(start: number, size: number, item: number, margin: number) {
  const min = start + margin;
  const max = start + size - margin - item;
  if (max >= min) return { min, max };
  const fallback = start + Math.max(0, (size - item) / 2);
  return { min: fallback, max: fallback };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Куда убежать кнопке от указателя. Чистая и детерминированная функция:
 * сдвигает кнопку от указателя и всегда оставляет её целиком внутри `bounds`
 * с отступом `margin`. Если передан `avoid` (кнопка «да»), на неё не встаёт.
 */
export function dodgePosition(
  button: Box,
  pointer: Point,
  bounds: Box,
  margin: number,
  avoid?: Box,
): Point {
  const ax = axis(bounds.x, bounds.w, button.w, margin);
  const ay = axis(bounds.y, bounds.h, button.h, margin);
  const place = (x: number, y: number): Point => ({
    x: clamp(x, ax.min, ax.max),
    y: clamp(y, ay.min, ay.max),
  });

  const cx = button.x + button.w / 2;
  const cy = button.y + button.h / 2;

  // Направление «от указателя»; если указатель ровно в центре, бежим к центру области.
  let dx = cx - pointer.x;
  let dy = cy - pointer.y;
  if (Math.hypot(dx, dy) < 1e-6) {
    dx = bounds.x + bounds.w / 2 - cx;
    dy = bounds.y + bounds.h / 2 - cy;
  }
  if (Math.hypot(dx, dy) < 1e-6) {
    dx = -1;
    dy = -1;
  }
  const base = Math.atan2(dy, dx);

  const minMove = Math.min(button.w, button.h) / 2;
  const pad = 8;
  const valid = (p: Point) => {
    const box = { x: p.x, y: p.y, w: button.w, h: button.h };
    if (avoid && overlaps(box, avoid, margin)) return false;
    const underPointer =
      pointer.x >= p.x - pad &&
      pointer.x <= p.x + button.w + pad &&
      pointer.y >= p.y - pad &&
      pointer.y <= p.y + button.h + pad;
    if (underPointer) return false;
    return Math.hypot(p.x - button.x, p.y - button.y) >= minMove;
  };

  // Сначала направления, близкие к «от указателя», потом всё дальше в стороны.
  const offsets = [0];
  for (let k = 1; k <= 8; k++) offsets.push(k, -k);
  const step = Math.max(button.w, button.h) * 1.6 + 24;
  for (const scale of [1, 1.8, 2.8]) {
    for (const k of offsets) {
      const angle = base + (k * Math.PI) / 8;
      const p = place(button.x + Math.cos(angle) * step * scale, button.y + Math.sin(angle) * step * scale);
      if (valid(p)) return p;
    }
  }

  // Запасной вариант: самая дальняя от указателя точка сетки, не задевающая «да».
  let best: Point = place(button.x, button.y);
  let bestScore = -Infinity;
  const n = 8;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const p: Point = {
        x: ax.min + ((ax.max - ax.min) * i) / n,
        y: ay.min + ((ay.max - ay.min) * j) / n,
      };
      const box = { x: p.x, y: p.y, w: button.w, h: button.h };
      const dist = Math.hypot(p.x + button.w / 2 - pointer.x, p.y + button.h / 2 - pointer.y);
      const score = dist - (avoid && overlaps(box, avoid) ? 1e6 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
  }
  return best;
}
