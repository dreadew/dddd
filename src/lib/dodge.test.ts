import { describe, expect, it } from "vitest";
import { dodgePosition, overlaps, type Box } from "./dodge";

// Экран телефона 390x844, отступ 12px.
const screen: Box = { x: 0, y: 0, w: 390, h: 844 };
const margin = 12;

function inside(pos: { x: number; y: number }, button: Box, bounds: Box, m: number) {
  expect(pos.x).toBeGreaterThanOrEqual(bounds.x + m);
  expect(pos.y).toBeGreaterThanOrEqual(bounds.y + m);
  expect(pos.x + button.w).toBeLessThanOrEqual(bounds.x + bounds.w - m);
  expect(pos.y + button.h).toBeLessThanOrEqual(bounds.y + bounds.h - m);
}

describe("dodgePosition", () => {
  it("при указателе над кнопкой возвращает другую позицию", () => {
    const button: Box = { x: 150, y: 400, w: 96, h: 48 };
    const pos = dodgePosition(button, { x: 198, y: 424 }, screen, margin);
    expect(pos.x !== button.x || pos.y !== button.y).toBe(true);
    inside(pos, button, screen, margin);
  });

  it("уходит от указателя: новая позиция дальше от него", () => {
    const button: Box = { x: 150, y: 400, w: 96, h: 48 };
    const pointer = { x: 160, y: 410 };
    const pos = dodgePosition(button, pointer, screen, margin);
    const before = Math.hypot(button.x + button.w / 2 - pointer.x, button.y + button.h / 2 - pointer.y);
    const after = Math.hypot(pos.x + button.w / 2 - pointer.x, pos.y + button.h / 2 - pointer.y);
    expect(after).toBeGreaterThan(before);
  });

  it("кнопка у правого края, указатель слева: не выходит за bounds", () => {
    const button: Box = { x: 390 - 12 - 96, y: 400, w: 96, h: 48 };
    const pos = dodgePosition(button, { x: button.x + 2, y: 424 }, screen, margin);
    inside(pos, button, screen, margin);
  });

  it("кнопка в каждом углу не выходит за bounds и всё равно сдвигается", () => {
    const w = 96;
    const h = 48;
    const corners: Box[] = [
      { x: margin, y: margin, w, h },
      { x: 390 - margin - w, y: margin, w, h },
      { x: margin, y: 844 - margin - h, w, h },
      { x: 390 - margin - w, y: 844 - margin - h, w, h },
    ];
    for (const button of corners) {
      // Указатель зажимает кнопку в угол.
      const pointer = { x: button.x + w / 2, y: button.y + h / 2 };
      const pos = dodgePosition(button, pointer, screen, margin);
      inside(pos, button, screen, margin);
      expect(pos.x !== button.x || pos.y !== button.y).toBe(true);
    }
  });

  it("работает с bounds не в начале координат", () => {
    const bounds: Box = { x: 100, y: 200, w: 300, h: 250 };
    const button: Box = { x: 300, y: 390, w: 88, h: 44 };
    const pos = dodgePosition(button, { x: 290, y: 380 }, bounds, 8);
    inside(pos, button, bounds, 8);
  });

  it("bounds меньше кнопки: позиция внутри bounds, без исключения", () => {
    const bounds: Box = { x: 10, y: 20, w: 50, h: 30 };
    const button: Box = { x: 10, y: 20, w: 96, h: 48 };
    let pos = { x: NaN, y: NaN };
    expect(() => {
      pos = dodgePosition(button, { x: 30, y: 30 }, bounds, margin);
    }).not.toThrow();
    expect(Number.isFinite(pos.x) && Number.isFinite(pos.y)).toBe(true);
    expect(pos.x).toBeGreaterThanOrEqual(bounds.x);
    expect(pos.x).toBeLessThanOrEqual(bounds.x + bounds.w);
    expect(pos.y).toBeGreaterThanOrEqual(bounds.y);
    expect(pos.y).toBeLessThanOrEqual(bounds.y + bounds.h);
  });

  it("детерминирован для одних и тех же входных данных", () => {
    const button: Box = { x: 150, y: 400, w: 96, h: 48 };
    const pointer = { x: 198, y: 424 };
    const a = dodgePosition(button, pointer, screen, margin);
    const b = dodgePosition(button, pointer, screen, margin);
    expect(a).toEqual(b);
  });

  it("не встаёт на кнопку «да», если передать её как avoid", () => {
    const bounds: Box = { x: 0, y: 0, w: 390, h: 300 };
    const yes: Box = { x: 40, y: 20, w: 120, h: 52 };
    const button: Box = { x: 230, y: 20, w: 96, h: 48 };
    // Указатель справа от «нет» толкает её влево, прямо на «да».
    for (const pointer of [
      { x: 320, y: 44 },
      { x: 300, y: 30 },
      { x: 278, y: 44 },
    ]) {
      const pos = dodgePosition(button, pointer, bounds, margin, yes);
      inside(pos, button, bounds, margin);
      expect(overlaps({ ...pos, w: button.w, h: button.h }, yes)).toBe(false);
    }
  });
});
