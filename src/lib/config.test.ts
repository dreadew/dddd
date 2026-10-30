import { describe, expect, it } from "vitest";
import { fillName, getHerName } from "./config";

describe("getHerName", () => {
  it("обрезает пробелы", () => expect(getHerName("  Аня ")).toBe("Аня"));
  it("пустая строка -> ты", () => expect(getHerName("")).toBe("ты"));
  it("undefined -> ты", () => expect(getHerName(undefined)).toBe("ты"));
  it("заглушка «Имя» -> ты", () => expect(getHerName("Имя")).toBe("ты"));
  it("заглушка с пробелами и регистром -> ты", () => expect(getHerName(" имя ")).toBe("ты"));
  it("настоящее имя остаётся", () => expect(getHerName("Аня")).toBe("Аня"));
});

describe("fillName", () => {
  it("заменяет все {name}", () =>
    expect(fillName("{name}, привет, {name}", "Аня")).toBe("Аня, привет, Аня"));
});

describe("fillName: неразрывные пробелы", () => {
  const NB = " ";
  it("короткие слова не висят в конце строки", () =>
    expect(fillName("Началось с вопроса и в октябре", "ты")).toBe(`Началось с${NB}вопроса и${NB}в${NB}октябре`));
  it("в начале фразы тоже", () => expect(fillName("С самого начала", "ты")).toBe(`С${NB}самого начала`));
  it("длинные слова и имя не трогает", () => expect(fillName("мне снилась {name}", "Аня")).toBe("мне снилась Аня"));
});
