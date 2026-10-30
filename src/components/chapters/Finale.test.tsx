import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// Подменяем только отклики финала: остальные тексты берутся настоящие.
const echoes = vi.hoisted(() => ({ list: [] as string[], fallback: "" }));

vi.mock("@/content/chapters", async (importActual) => {
  const actual = await importActual<typeof import("@/content/chapters")>();
  return {
    ...actual,
    finaleEcho: (answer: number | null) =>
      (answer !== null && echoes.list[answer]) || echoes.fallback,
  };
});

const { Finale } = await import("./Finale");
const { finaleLines, finaleNote } = await import("@/content/chapters");

const paragraphs = (html: string) => html.match(/<p[\s>]/g)?.length ?? 0;

describe("Finale", () => {
  afterEach(() => {
    echoes.list = [];
    echoes.fallback = "";
  });

  it("пустой отклик: абзаца для него нет, P.S. последний", () => {
    const html = renderToStaticMarkup(<Finale answer={0} />);
    expect(paragraphs(html)).toBe(finaleLines.length + 1);
    expect(html.trimEnd()).toMatch(/data-finale-note[^>]*>[^<]*<\/p><\/div>$/);
    expect(html).toContain(finaleNote.slice(0, 20));
  });

  it("непустой отклик показывается перед P.S.", () => {
    echoes.list = ["Отклик А", "Отклик Б"];
    const html = renderToStaticMarkup(<Finale answer={1} />);
    expect(paragraphs(html)).toBe(finaleLines.length + 2);
    expect(html.indexOf("Отклик Б")).toBeGreaterThan(-1);
    expect(html.indexOf("Отклик Б")).toBeLessThan(html.indexOf("data-finale-note"));
  });

  it("без ответа и с запасной фразой показывает запасную", () => {
    echoes.fallback = "Запасная";
    const html = renderToStaticMarkup(<Finale answer={null} />);
    expect(html).toContain("Запасная");
  });
});
