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
  it("idle + toggle -> idle", () => expect(nextStatus("idle", "toggle")).toBe("idle"));
});
