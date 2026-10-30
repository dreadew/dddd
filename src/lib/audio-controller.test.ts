import { describe, expect, it } from "vitest";
import { createAudioController } from "./audio-controller";
import type { AudioStatus } from "./audio-state";

// Подделка HTMLAudioElement. События play/pause приходят синхронно, раньше, чем
// резолвится промис play(): так проверяется худший порядок событий.
class FakeAudio extends EventTarget {
  paused = true;
  currentTime = 0;
  duration = NaN;
  loop = true;
  ended = false;
  src = "/main.mp3";
  playCalls = 0;
  nextPlay: "ok" | "fail" | "abort" = "ok";
  // Файлы, которых «нет»: play() на них падает с ошибкой элемента.
  missing = new Set<string>();

  play(): Promise<void> {
    this.playCalls++;
    if (this.missing.has(this.src)) {
      this.dispatchEvent(new Event("error"));
      return Promise.reject(new DOMException("no source", "NotSupportedError"));
    }
    if (this.nextPlay === "fail") return Promise.reject(new DOMException("no source", "NotSupportedError"));
    if (this.nextPlay === "abort") return Promise.reject(new DOMException("interrupted", "AbortError"));
    this.paused = false;
    this.ended = false;
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

  // Время идёт, только пока играет: как у настоящего элемента.
  tick(seconds: number) {
    if (this.paused) return;
    this.currentTime += seconds;
    this.dispatchEvent(new Event("timeupdate"));
  }

  end() {
    this.ended = true;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
    this.dispatchEvent(new Event("ended"));
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

const clip = { src: "/clip.mp3", startAt: 42, duration: 30 };

function setupClip(clipOverride: Partial<typeof clip> = {}) {
  const audio = new FakeAudio();
  const seen: AudioStatus[] = [];
  const progress: number[] = [];
  const tracks: string[] = [];
  const ctrl = createAudioController(
    audio,
    {
      onStatus: (s) => seen.push(s),
      onProgress: (p) => progress.push(p),
      onTrack: (t) => tracks.push(t),
    },
    { mainSrc: "/main.mp3", clip: { ...clip, ...clipOverride } },
  );
  return { audio, ctrl, seen, progress, tracks };
}

// Основной трек играет и дошёл до 75-й секунды.
async function playingMain(clipOverride: Partial<typeof clip> = {}) {
  const env = setupClip(clipOverride);
  await env.ctrl.start();
  env.audio.duration = 200;
  env.audio.currentTime = 75;
  return env;
}

describe("отрывок песни в главе", () => {
  it("играет с startAt ровно duration секунд, без повтора", async () => {
    const { audio, ctrl, tracks } = await playingMain();
    ctrl.enterClip();
    await flush();
    expect(audio.src).toBe("/clip.mp3");
    expect(audio.loop).toBe(false);
    expect(audio.currentTime).toBe(42);
    expect(audio.paused).toBe(false);
    expect(ctrl.getTrack()).toBe("clip");
    expect(ctrl.getStatus()).toBe("playing");
    expect(tracks).toEqual(["clip"]);
    audio.tick(29);
    expect(ctrl.getTrack()).toBe("clip");
    audio.tick(1);
    await flush();
    expect(ctrl.getTrack()).toBe("main");
    expect(audio.src).toBe("/main.mp3");
  });

  it("после отрывка основной трек продолжается с сохранённого места", async () => {
    const { audio, ctrl, seen } = await playingMain();
    ctrl.enterClip();
    await flush();
    audio.tick(30);
    await flush();
    expect(audio.src).toBe("/main.mp3");
    expect(audio.loop).toBe(true);
    expect(audio.currentTime).toBe(75);
    expect(audio.paused).toBe(false);
    expect(ctrl.getStatus()).toBe("playing");
    // Переключение не мигает статусом paused.
    expect(seen).not.toContain("paused");
  });

  it("прогресс во время отрывка считается от его начала и длины", async () => {
    const { audio, ctrl, progress } = await playingMain();
    ctrl.enterClip();
    await flush();
    audio.tick(15);
    expect(progress.at(-1)).toBe(0.5);
  });

  it("если музыка на паузе, отрывок не включается", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.toggle();
    const calls = audio.playCalls;
    ctrl.enterClip();
    await flush();
    expect(audio.src).toBe("/main.mp3");
    expect(audio.playCalls).toBe(calls);
    expect(ctrl.getTrack()).toBe("main");
    expect(ctrl.getStatus()).toBe("paused");
  });

  it("до старта музыки (idle) и при ошибке отрывок не включается", async () => {
    const { audio, ctrl } = setupClip();
    ctrl.enterClip();
    await flush();
    expect(audio.playCalls).toBe(0);
    audio.fail();
    ctrl.enterClip();
    await flush();
    expect(audio.playCalls).toBe(0);
    expect(audio.src).toBe("/main.mp3");
  });

  it("нет файла отрывка: тихо пропускаем, основной трек играет дальше", async () => {
    const { audio, ctrl, seen } = await playingMain();
    audio.missing.add("/clip.mp3");
    ctrl.enterClip();
    await flush();
    await flush();
    expect(ctrl.getStatus()).toBe("playing");
    expect(seen).not.toContain("error");
    expect(ctrl.getTrack()).toBe("main");
    expect(audio.src).toBe("/main.mp3");
    expect(audio.currentTime).toBe(75);
    expect(audio.paused).toBe(false);
  });

  it("ошибка элемента во время отрывка возвращает основной трек, а не error", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.enterClip();
    await flush();
    audio.fail();
    await flush();
    expect(ctrl.getStatus()).toBe("playing");
    expect(audio.src).toBe("/main.mp3");
    expect(audio.currentTime).toBe(75);
  });

  it("ушла из главы раньше: отрывок обрывается, основной трек продолжается", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.enterClip();
    await flush();
    audio.tick(10);
    ctrl.exitClip();
    await flush();
    expect(ctrl.getTrack()).toBe("main");
    expect(audio.src).toBe("/main.mp3");
    expect(audio.currentTime).toBe(75);
    expect(audio.paused).toBe(false);
    expect(ctrl.getStatus()).toBe("playing");
  });

  it("ушла, пока отрывок ещё загружался: поздний ответ play() ничего не ломает", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.enterClip();
    ctrl.exitClip();
    await flush();
    expect(audio.src).toBe("/main.mp3");
    expect(ctrl.getTrack()).toBe("main");
    expect(ctrl.getStatus()).toBe("playing");
  });

  it("отрывок играет один раз: вернулась в главу, повтора нет", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.enterClip();
    await flush();
    audio.tick(30);
    await flush();
    const calls = audio.playCalls;
    ctrl.exitClip();
    ctrl.enterClip();
    await flush();
    expect(audio.src).toBe("/main.mp3");
    expect(audio.playCalls).toBe(calls);
  });

  it("раннее завершение тоже считается: повтора нет", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.enterClip();
    await flush();
    ctrl.exitClip();
    await flush();
    ctrl.enterClip();
    await flush();
    expect(audio.src).toBe("/main.mp3");
  });

  it("пауза во время отрывка ставит паузу отрывку, продолжить продолжает его", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.enterClip();
    await flush();
    audio.tick(10);
    ctrl.toggle();
    expect(ctrl.getStatus()).toBe("paused");
    expect(audio.paused).toBe(true);
    audio.tick(100); // на паузе время не идёт
    expect(ctrl.getTrack()).toBe("clip");
    ctrl.toggle();
    await flush();
    expect(ctrl.getStatus()).toBe("playing");
    expect(audio.src).toBe("/clip.mp3");
    expect(audio.currentTime).toBe(52);
    audio.tick(20);
    await flush();
    expect(ctrl.getTrack()).toBe("main");
    expect(audio.currentTime).toBe(75);
    expect(audio.paused).toBe(false);
  });

  it("ушла из главы, пока отрывок на паузе: основной трек вернулся, но тоже на паузе", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.enterClip();
    await flush();
    ctrl.toggle();
    ctrl.exitClip();
    await flush();
    expect(ctrl.getTrack()).toBe("main");
    expect(audio.src).toBe("/main.mp3");
    expect(audio.currentTime).toBe(75);
    expect(audio.paused).toBe(true);
    expect(ctrl.getStatus()).toBe("paused");
    ctrl.toggle();
    await flush();
    expect(ctrl.getStatus()).toBe("playing");
    expect(audio.src).toBe("/main.mp3");
  });

  it("файл отрывка короче duration: по событию ended возвращаемся к основному", async () => {
    const { audio, ctrl } = await playingMain();
    ctrl.enterClip();
    await flush();
    audio.tick(5);
    audio.end();
    await flush();
    expect(ctrl.getTrack()).toBe("main");
    expect(audio.paused).toBe(false);
    expect(ctrl.getStatus()).toBe("playing");
  });

  it("двойной вызов enterClip (StrictMode) включает отрывок один раз", async () => {
    const { audio, ctrl } = await playingMain();
    const calls = audio.playCalls;
    ctrl.enterClip();
    ctrl.enterClip();
    await flush();
    expect(audio.playCalls).toBe(calls + 1);
    expect(ctrl.getTrack()).toBe("clip");
  });

  it("двойной mount провайдера (StrictMode): старый контроллер ничего не трогает", async () => {
    const audio = new FakeAudio();
    const opts = { mainSrc: "/main.mp3", clip };
    const first = createAudioController(audio, { onStatus: () => {} }, opts);
    first.dispose();
    const second = createAudioController(audio, { onStatus: () => {} }, opts);
    await second.start();
    audio.currentTime = 75;
    first.enterClip();
    await flush();
    expect(audio.src).toBe("/main.mp3");
    second.enterClip();
    await flush();
    expect(audio.src).toBe("/clip.mp3");
    audio.tick(30);
    await flush();
    expect(second.getTrack()).toBe("main");
    expect(audio.currentTime).toBe(75);
    expect(second.getStatus()).toBe("playing");
  });

  it("без отрывка в настройках enterClip ничего не делает", async () => {
    const { audio, ctrl } = setup();
    await ctrl.start();
    ctrl.enterClip();
    ctrl.exitClip();
    await flush();
    expect(audio.src).toBe("/main.mp3");
    expect(ctrl.getTrack()).toBe("main");
  });
});
