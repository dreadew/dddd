import { describe, expect, it } from "vitest";
import { fillName, getHerName } from "@/lib/config";
import {
  chapters,
  finaleLines,
  finaleNote,
  questionText,
} from "./chapters";
import * as content from "./chapters";
import { track } from "./track";

const order = ["evening", "talk", "places", "night", "question", "finale"];

// Весь текст сайта, кроме самого предложения.
const allCopy = [
  ...chapters.flatMap((c) => [c.title, c.subtitle ?? "", ...c.lines]),
  ...finaleLines,
  finaleNote,
  questionText.yes,
  questionText.no,
  ...questionText.noTeases,
  questionText.afterYes,
  questionText.noDisabledHint,
];

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

  it("заголовки глав без «Глава …»-подписей", () => {
    for (const c of chapters) expect(c.title).not.toMatch(/глава|финал\./i);
  });

  it("хотя бы в одном тексте глав есть {name}", () => {
    const all = chapters.flatMap((c) => [c.title, c.subtitle ?? "", ...c.lines]);
    expect(all.some((t) => t.includes("{name}"))).toBe(true);
  });

  it("{name} подставляется fillName", () => {
    const line = chapters.flatMap((c) => c.lines).find((l) => l.includes("{name}"))!;
    expect(fillName(line, "Аня")).not.toContain("{name}");
    expect(fillName(line, getHerName(undefined))).toContain("ты");
  });

  it("знакомство начинается с пиццы и Смешариков", () => {
    const evening = chapters.find((c) => c.id === "evening")!.lines.join("\n");
    expect(evening).toMatch(/пицц/i);
    expect(evening).toMatch(/смешарик/i);
  });

  it("первое свидание и взаимность есть в тексте", () => {
    const text = chapters.flatMap((c) => c.lines).join("\n");
    expect(text).toMatch(/взаимност/i);
  });

  it("глава night рассказывает про сон после похода", () => {
    const night = chapters.find((c) => c.id === "night")!.lines.join("\n");
    expect(night).toMatch(/пох/i);
    expect(night).toMatch(/сни|сон|во сне/i);
  });

  it("в главе мест есть набережная и утки", () => {
    const places = chapters.find((c) => c.id === "places")!.lines.join("\n");
    expect(places).toMatch(/набережн/i);
    expect(places).toMatch(/утк/i);
  });
});

describe("убранное из текстов", () => {
  const banned = [
    /кабан/i,
    /камал/i,
    /спорить или молчать/i,
    /перв(ая|ую|ой) ноч/i,
    /выспал/i,
    /спали вместе/i,
    /fell in love/i,
    /girl in red/i,
  ];

  it("нет Кабана, театра Камала, старого вопроса, первой ночи и старого трека", () => {
    for (const text of allCopy) for (const re of banned) expect(text).not.toMatch(re);
  });
});

describe("защита от спойлеров", () => {
  it("текст предложения не встречается в других главах и текстах", () => {
    for (const c of chapters.filter((c) => c.id !== "question")) {
      expect(c.lines.join("\n")).not.toContain(questionText.ask);
    }
    for (const text of allCopy) expect(text).not.toContain(questionText.ask);
  });

  it("в предложении «ты», без {name}", () => {
    expect(questionText.ask).not.toContain("{name}");
    expect(questionText.ask).toMatch(/(^|[^а-яё])ты([^а-яё]|$)/i);
  });

  it("имя из одних пробелов превращается в «ты»", () => {
    expect(getHerName("   ")).toBe("ты");
  });
});

describe("разговор и финал", () => {
  it("noTeases не меньше 3 фраз", () => {
    expect(questionText.noTeases.length).toBeGreaterThanOrEqual(3);
    expect(questionText.ask.trim()).not.toBe("");
    expect(questionText.yes.trim()).not.toBe("");
    expect(questionText.no.trim()).not.toBe("");
  });

  it("вопроса «Ночной город или рассвет?» и откликов на него в финале больше нет", () => {
    for (const name of ["talkQuestion", "talkReactions", "finaleEchoes", "finaleEchoFallback", "finaleEcho"]) {
      expect(content).not.toHaveProperty(name);
    }
    for (const text of allCopy) expect(text).not.toMatch(/ночной город или рассвет/i);
  });

  it("P.S. в финале не пустой и не начинается с {name}", () => {
    expect(finaleNote.trim()).not.toBe("");
    expect(finaleNote.startsWith("{name}")).toBe(false);
  });

  it("финал не пустой", () => {
    expect(finaleLines.length).toBeGreaterThan(0);
  });
});

describe("трек", () => {
  it("название, исполнитель и файл из public/", () => {
    expect(track).toEqual({ title: "Sweet Creature", artist: "Harry Styles", src: "/sweet-creature.mp3" });
  });
});
