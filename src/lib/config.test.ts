import { describe, expect, it } from "vitest";
import { fillName, getHerName } from "./config";

describe("getHerName", () => {
  it("обрезает пробелы", () => expect(getHerName("  Аня ")).toBe("Аня"));
  it("пустая строка -> ты", () => expect(getHerName("")).toBe("ты"));
  it("undefined -> ты", () => expect(getHerName(undefined)).toBe("ты"));
});

describe("fillName", () => {
  it("заменяет все {name}", () =>
    expect(fillName("{name}, привет, {name}", "Аня")).toBe("Аня, привет, Аня"));
});
