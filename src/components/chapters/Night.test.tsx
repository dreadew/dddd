import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { chapters } from "@/content/chapters";
import { fillName } from "@/lib/config";
import { Night } from "./Night";

const chapter = chapters.find((c) => c.id === "night")!;

describe("Night", () => {
  const html = renderToStaticMarkup(<Night chapter={chapter} name="Аня" />);

  it("рисует одну декоративную картинку, скрытую от читалок", () => {
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toContain('aria-hidden="true"');
  });

  it("в картинке нет текста, только фигуры", () => {
    expect(html).not.toMatch(/<text[\s>]/);
  });

  it("id внутри картинки с префиксом главы", () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id).toMatch(/^night-/);
  });

  it("все строки главы на месте", () => {
    const paragraphs = html.match(/<p[\s>]/g) ?? [];
    expect(paragraphs).toHaveLength(chapter.lines.length);
    for (const line of chapter.lines) {
      const text = fillName(line, "Аня").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      expect(html).toContain(text);
    }
  });
});
