import { describe, expect, it } from "vitest";
import { fillName, getHerName } from "@/lib/config";
import { chapters, finaleLines, questionText, talkQuestions, talkReactions } from "./chapters";

const order = ["evening", "talk", "places", "night", "question", "finale"];

describe("chapters", () => {
  it("ровно 6 глав в нужном порядке с уникальными id", () => {
    expect(chapters.map((c) => c.id)).toEqual(order);
    expect(new Set(chapters.map((c) => c.id)).size).toBe(6);
  });

  it("у каждой главы непустые title и lines", () => {
    for (const c of chapters) {
      expect(c.title.trim()).not.toBe("");
      expect(c.lines.length).toBeGreaterThan(0);
      for (const line of c.lines) expect(line.trim()).not.toBe("");
    }
  });

  it("хотя бы в одном тексте глав есть {name}", () => {
    const all = chapters.flatMap((c) => [c.title, c.subtitle, ...c.lines]);
    expect(all.some((t) => t.includes("{name}"))).toBe(true);
  });

  it("{name} подставляется fillName", () => {
    const line = chapters.flatMap((c) => c.lines).find((l) => l.includes("{name}"))!;
    expect(fillName(line, "Аня")).not.toContain("{name}");
  });
});

describe("защита от спойлеров", () => {
  it("текст предложения не встречается в других главах", () => {
    for (const c of chapters.filter((c) => c.id !== "question")) {
      expect(c.lines).not.toContain(questionText.ask);
      expect(c.lines.join("\n")).not.toContain(questionText.ask);
    }
  });

  it("имя из одних пробелов превращается в «ты»", () => {
    expect(getHerName("   ")).toBe("ты");
  });
});

describe("questionText и прочее", () => {
  it("noTeases не меньше 3 фраз", () => {
    expect(questionText.noTeases.length).toBeGreaterThanOrEqual(3);
    expect(questionText.ask.trim()).not.toBe("");
    expect(questionText.yes.trim()).not.toBe("");
    expect(questionText.no.trim()).not.toBe("");
  });

  it("два вопроса в разговоре, по два варианта", () => {
    expect(talkQuestions).toHaveLength(2);
    for (const q of talkQuestions) expect(q.options).toHaveLength(2);
  });

  it("на каждый вариант разговора есть реакция", () => {
    expect(talkReactions).toHaveLength(talkQuestions.length);
    for (const r of talkReactions) {
      expect(r).toHaveLength(2);
      for (const text of r) expect(text.trim()).not.toBe("");
    }
  });

  it("финал не пустой", () => {
    expect(finaleLines.length).toBeGreaterThan(0);
  });
});
