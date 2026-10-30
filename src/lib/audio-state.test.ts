import { describe, expect, it } from "vitest";
import { nextStatus } from "./audio-state";

describe("nextStatus", () => {
  it("idle + start -> playing", () => expect(nextStatus("idle", "start")).toBe("playing"));
  it("playing + toggle -> paused", () => expect(nextStatus("playing", "toggle")).toBe("paused"));
  it("paused + toggle -> playing", () => expect(nextStatus("paused", "toggle")).toBe("playing"));
  it("any + fail -> error", () => {
    for (const s of ["idle", "playing", "paused", "error"] as const)
      expect(nextStatus(s, "fail")).toBe("error");
  });
  it("error + toggle -> error", () => expect(nextStatus("error", "toggle")).toBe("error"));
  it("playing + externalPause -> paused", () => expect(nextStatus("playing", "externalPause")).toBe("paused"));
  it("paused + externalPlay -> playing", () => expect(nextStatus("paused", "externalPlay")).toBe("playing"));
  it("idle/error не оживают от внешних событий", () => {
    for (const s of ["idle", "error"] as const)
      for (const e of ["externalPause", "externalPlay"] as const) expect(nextStatus(s, e)).toBe(s);
  });
  it("externalPause при paused и externalPlay при playing ничего не меняют", () => {
    expect(nextStatus("paused", "externalPause")).toBe("paused");
    expect(nextStatus("playing", "externalPlay")).toBe("playing");
  });
  it("idle + toggle -> idle", () => expect(nextStatus("idle", "toggle")).toBe("idle"));
});
