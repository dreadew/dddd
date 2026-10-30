import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { chapters, talkQuestion } from "@/content/chapters";
import { fillName } from "@/lib/config";
import { Talk } from "./Talk";

const chapter = chapters.find((c) => c.id === "talk")!;
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

describe("Talk", () => {
  const html = renderToStaticMarkup(<Talk chapter={chapter} name="Аня" onAnswer={() => {}} />);
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
    // двое человечков с рукой для рукопожатия у каждого
    expect(scene.match(/class="date-walk"/g)?.length).toBe(4);
    expect(scene.match(/class="date-arm"/g)?.length).toBe(4);
    expect(scene).toContain('class="date-spark"');
  });

  it("картинка стоит перед текстом, все строки и вопрос на месте", () => {
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("<p"));
    for (const line of chapter.lines) expect(html).toContain(escape(fillName(line, "Аня")));
    expect(html).toContain(escape(talkQuestion.prompt));
    for (const option of talkQuestion.options) expect(html).toContain(escape(option));
  });

  it("разметка детерминирована", () => {
    const again = renderToStaticMarkup(<Talk chapter={chapter} name="Аня" onAnswer={() => {}} />);
    expect(again).toBe(html);
  });
});
