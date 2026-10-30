import { describe, expect, it } from "vitest";
import { createAudioController } from "./audio-controller";
import type { AudioStatus } from "./audio-state";

// Подделка HTMLAudioElement. События play/pause приходят синхронно, раньше, чем
// резолвится промис play(): так проверяется худший порядок событий.
class FakeAudio extends EventTarget {
  paused = true;
  currentTime = 0;
  duration = NaN;
  playCalls = 0;
  nextPlay: "ok" | "fail" | "abort" = "ok";

  play(): Promise<void> {
    this.playCalls++;
    if (this.nextPlay === "fail") return Promise.reject(new DOMException("no source", "NotSupportedError"));
    if (this.nextPlay === "abort") return Promise.reject(new DOMException("interrupted", "AbortError"));
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }

  // Как система: звонок, экран блокировки, наушники.
  osPause() {
    this.pause();
  }

  osPlay() {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  }

  fail() {
    this.dispatchEvent(new Event("error"));
  }

  addEventListener(type: string, listener: () => void) {
    super.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: () => void) {
    super.removeEventListener(type, listener);
  }
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function setup() {
  const audio = new FakeAudio();
  const seen: AudioStatus[] = [];
  const progress: number[] = [];
  const ctrl = createAudioController(audio, {
    onStatus: (s) => seen.push(s),
    onProgress: (p) => progress.push(p),
  });
  return { audio, ctrl, seen, progress };
}

describe("createAudioController", () => {
  it("start: idle -> playing", async () => {
    const { ctrl } = setup();
    await ctrl.start();
    expect(ctrl.getStatus()).toBe("playing");
  });

  it("пауза, потом продолжить: в итоге playing", async () => {
    const { audio, ctrl, seen } = setup();
    await ctrl.start();
    ctrl.toggle();
    expect(ctrl.getStatus()).toBe("paused");
    expect(audio.paused).toBe(true);
    ctrl.toggle();
    await flush();
    expect(audio.paused).toBe(false);
    expect(ctrl.getStatus()).toBe("playing");
    expect(seen.at(-1)).toBe("playing");
  });

  it("несколько циклов пауза/продолжить не сбивают статус", async () => {
    const { audio, ctrl } = setup();
    await ctrl.start();
    for (let i = 0; i < 3; i++) {
      ctrl.toggle();
      await flush();
      expect(ctrl.getStatus()).toBe("paused");
      ctrl.toggle();
      await flush();
      expect(ctrl.getStatus()).toBe("playing");
      expect(audio.paused).toBe(false);
    }
  });

  it("пауза от системы (событие pause) -> paused, и play от системы -> playing", async () => {
    const { audio, ctrl } = setup();
    await ctrl.start();
    audio.osPause();
    expect(ctrl.getStatus()).toBe("paused");
    audio.osPlay();
    expect(ctrl.getStatus()).toBe("playing");
  });

  it("после системной паузы кнопка продолжает музыку", async () => {
    const { audio, ctrl } = setup();
    await ctrl.start();
    audio.osPause();
    ctrl.toggle();
    await flush();
    expect(ctrl.getStatus()).toBe("playing");
  });

  it("ошибка элемента -> error, и ничто её не оживляет", async () => {
    const { audio, ctrl } = setup();
    await ctrl.start();
    audio.fail();
    expect(ctrl.getStatus()).toBe("error");
    const calls = audio.playCalls;
    ctrl.toggle();
    await ctrl.start();
    audio.osPlay();
    audio.osPause();
    await flush();
    expect(ctrl.getStatus()).toBe("error");
    expect(audio.playCalls).toBe(calls);
  });

  it("idle не оживает от событий и кнопки", async () => {
    const { audio, ctrl } = setup();
    audio.osPlay();
    audio.osPause();
    ctrl.toggle();
    await flush();
    expect(ctrl.getStatus()).toBe("idle");
    expect(audio.playCalls).toBe(0);
  });

  it("start без файла -> error", async () => {
    const { audio, ctrl } = setup();
    audio.nextPlay = "fail";
    await ctrl.start();
    expect(ctrl.getStatus()).toBe("error");
  });

  it("продолжить не удалось -> error", async () => {
    const { audio, ctrl } = setup();
    await ctrl.start();
    ctrl.toggle();
    audio.nextPlay = "fail";
    ctrl.toggle();
    await flush();
    expect(ctrl.getStatus()).toBe("error");
  });

  it("прерванный play (AbortError) не считается поломкой", async () => {
    const { audio, ctrl } = setup();
    await ctrl.start();
    ctrl.toggle();
    audio.nextPlay = "abort";
    ctrl.toggle();
    await flush();
    expect(ctrl.getStatus()).toBe("paused");
  });

  it("прогресс считается от длительности", async () => {
    const { audio, progress } = setup();
    audio.duration = 200;
    audio.currentTime = 50;
    audio.dispatchEvent(new Event("timeupdate"));
    expect(progress.at(-1)).toBe(0.25);
  });

  it("dispose снимает слушатели", async () => {
    const { audio, ctrl } = setup();
    await ctrl.start();
    ctrl.dispose();
    audio.osPause();
    expect(ctrl.getStatus()).toBe("playing");
  });
});
