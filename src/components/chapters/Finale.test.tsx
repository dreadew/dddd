import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { chapters, finaleLines, finaleNote } from "@/content/chapters";
import { fillName } from "@/lib/config";
import { Finale } from "./Finale";

const chapter = chapters.find((c) => c.id === "finale")!;
// fillName ставит неразрывные пробелы после коротких слов, поэтому сравниваем без них.
const plain = (s: string) => s.replace(/ /g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"');

describe("Finale", () => {
  const html = renderToStaticMarkup(<Finale chapter={chapter} name="Аня" />);

  it("все строки главы и финала на месте, по порядку", () => {
    const texts = [...chapter.lines, ...finaleLines].map((l) => plain(fillName(l, "Аня")));
    let from = 0;
    for (const text of texts) {
      const at = plain(html).indexOf(text, from);
      expect(at).toBeGreaterThan(-1);
      from = at + text.length;
    }
  });

  it("лишних абзацев нет: строки главы, строки финала и P.S.", () => {
    expect(html.match(/<p[\s>]/g)?.length).toBe(chapter.lines.length + finaleLines.length + 1);
  });

  it("P.S. стоит последним", () => {
    expect(html.trimEnd()).toMatch(/data-finale-note[^>]*>[^<]*<\/p><\/div>$/);
    expect(plain(html)).toContain(plain(fillName(finaleNote, "Аня")));
  });
});
