import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { chapters } from "@/content/chapters";
import { fillName } from "@/lib/config";
import { Talk } from "./Talk";

const chapter = chapters.find((c) => c.id === "talk")!;
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

describe("Talk", () => {
  const html = renderToStaticMarkup(<Talk chapter={chapter} name="Аня" />);
  const scene = html.slice(html.indexOf("<svg"), html.indexOf("</svg>") + 6);

  it("рисует одну декоративную картинку, скрытую от читалок", () => {
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toContain('aria-hidden="true"');
  });

  it("в картинке нет текста, только фигуры", () => {
    expect(scene).not.toMatch(/<text[\s>]/);
  });

  it("id внутри картинки с префиксом сцены", () => {
    const ids = [...scene.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id).toMatch(/^date-/);
  });

  it("встреча ждёт появления на экране: на сервере без date-go", () => {
    const svgClass = scene.match(/<svg[^>]*class="([^"]*)"/)![1].split(/\s+/);
    expect(svgClass).toContain("date-scene");
    expect(svgClass).not.toContain("date-go");
    // двое человечков (тень и тело у каждого) и по руке с ладонью для рукопожатия
    expect(scene.match(/class="date-walk"/g)?.length).toBe(4);
    expect(scene.match(/class="date-arm"/g)?.length).toBe(2);
    expect(scene).toContain('class="date-spark"');
  });

  it("человечки крупные: на экране 390 px (картинка ~340 px) ростом не меньше ~55 px", () => {
    const [, , w] = scene.match(/viewBox="([^"]+)"/)![1].split(/\s+/).map(Number);
    const scales = [...scene.matchAll(/scale\((-?[\d.]+) ([\d.]+)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(scales).toHaveLength(2);
    // один смотрит вправо, другой отражён и смотрит на него
    expect(scales.map(([x]) => Math.sign(x)).sort()).toEqual([-1, 1]);
    // рост человечка в своих единицах ~29
    for (const [, y] of scales) expect((29 * y * 340) / w).toBeGreaterThanOrEqual(55);
  });

  it("картинка стоит перед текстом, все строки на месте", () => {
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("<p"));
    expect(html.match(/<p[\s>]/g)?.length).toBe(chapter.lines.length);
    for (const line of chapter.lines) expect(html).toContain(escape(fillName(line, "Аня")));
  });

  it("вопроса и кнопок в главе больше нет", () => {
    expect(html).not.toMatch(/<(button|fieldset)[\s>]/);
  });

  it("разметка детерминирована", () => {
    const again = renderToStaticMarkup(<Talk chapter={chapter} name="Аня" />);
    expect(again).toBe(html);
  });
});
