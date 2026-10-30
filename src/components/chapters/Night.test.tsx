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

  it("кадр выше прежнего ландшафтного 360x204, чтобы читался на телефоне", () => {
    const [, , w, h] = html.match(/viewBox="([^"]+)"/)![1].split(/\s+/).map(Number);
    expect(h / w).toBeGreaterThan(204 / 360);
  });

  it("анимации сцены на месте: окна мерцают, зарево дышит, туман плывёт", () => {
    expect(html).toContain('class="night-twinkle"');
    expect(html).toContain('class="night-glow"');
    expect(html).toContain('class="night-mist"');
  });

  it("картинка стоит перед текстом", () => {
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("<p"));
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
