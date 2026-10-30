import { nextStatus, type AudioEvent, type AudioStatus } from "./audio-state";

// Ровно то, что контроллеру нужно от HTMLAudioElement: так его можно проверить подделкой в Node.
export type AudioLike = {
  paused: boolean;
  ended?: boolean;
  currentTime: number;
  duration: number;
  loop?: boolean;
  src?: string;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
};

// Что сейчас звучит: основной трек или отрывок песни в главе.
export type TrackKind = "main" | "clip";

export type ClipConfig = { src: string; startAt: number; duration: number };

export type AudioTracks = { mainSrc: string; clip?: ClipConfig };

export type AudioController = {
  getStatus(): AudioStatus;
  getTrack(): TrackKind;
  start(): Promise<void>;
  toggle(): void;
  enterClip(): void;
  exitClip(): void;
  setMuffle(enabled: boolean): void;
  dispose(): void;
};

const isAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

export function createAudioController(
  audio: HTMLMediaElement,
  context: AudioContext,
  filter: BiquadFilterNode,
  handlers: {
    onStatus(status: AudioStatus): void;
    onProgress?(progress: number): void;
    onTrack?(track: TrackKind): void;
  },
  tracks?: AudioTracks,
): AudioController {
  let status: AudioStatus = "idle";
  let disposed = false;

  const source = context.createMediaElementSource(audio);
  source.connect(filter);
  filter.connect(context.destination);

  // Отрывок: pending -> (clip) -> done. Играет не больше одного раза за визит.
  const clip = tracks?.clip && tracks.clip.duration > 0 ? tracks.clip : undefined;
  let clipState: "pending" | "done" = "pending";
  let track: TrackKind = "main";
  let mainPosition = 0;
  // Пока меняем src, события pause/play самого элемента статус не трогают.
  let swapping = false;
  // Номер переключения: поздние ответы play() от прошлых переключений игнорируются.
  let generation = 0;

  const dispatch = (event: AudioEvent) => {
    if (disposed) return;
    status = nextStatus(status, event);
    handlers.onStatus(status);
  };

  const setTrack = (next: TrackKind) => {
    if (track === next) return;
    track = next;
    handlers.onTrack?.(next);
  };

  // Один и тот же элемент (iOS разрешает play() без жеста только ему): меняем src и время.
  // Время ставим и сразу, и после loadedmetadata: до загрузки браузер может его не принять.
  let pendingSeek: number | null = null;
  const load = (src: string, at: number, loop: boolean) => {
    audio.loop = loop;
    audio.src = src;
    pendingSeek = at;
    try {
      audio.currentTime = at;
    } catch {
      // Старый WebKit бросает InvalidStateError, пока нет метаданных: перемотает onMeta.
    }
  };
  const onMeta = () => {
    if (pendingSeek !== null && Math.abs(audio.currentTime - pendingSeek) > 0.5) {
      audio.currentTime = pendingSeek;
    }
    pendingSeek = null;
  };

  const clipEnd = () => (clip ? clip.startAt + clip.duration : 0);

  function backToMain() {
    if (disposed || track !== "clip" || !tracks) return;
    const wasPlaying = status === "playing";
    const gen = ++generation;
    clipState = "done";
    setTrack("main");
    swapping = true;
    audio.pause();
    load(tracks.mainSrc, mainPosition, true);
    if (!wasPlaying) {
      swapping = false;
      return;
    }
    audio.play().then(
      () => {
        if (gen !== generation) return;
        swapping = false;
        if (!audio.paused) dispatch("start");
      },
      () => {
        if (gen !== generation) return;
        swapping = false;
        // Отказ play() (iOS: NotAllowedError вне жеста, AbortError) — не поломка:
        // основной трек стоит на своём месте, статус paused, следующее нажатие на плеер
        // (настоящий жест) его продолжит. Настоящая ошибка файла придёт событием error.
        dispatch("externalPause");
      },
    );
  }

  const onError = () => {
    if (disposed) return;
    // Отрывок не загрузился или сломался: молча возвращаемся к основному треку.
    if (track === "clip") return backToMain();
    dispatch("fail");
  };
  const onTime = () => {
    if (disposed) return;
    if (track === "clip" && clip) {
      if (swapping) return;
      const p = (audio.currentTime - clip.startAt) / clip.duration;
      handlers.onProgress?.(Math.min(1, Math.max(0, p)));
      if (audio.currentTime >= clipEnd()) backToMain();
      return;
    }
    if (audio.duration > 0 && isFinite(audio.duration)) {
      handlers.onProgress?.(Math.min(1, audio.currentTime / audio.duration));
    }
  };
  const onPause = () => {
    if (swapping) return;
    // Конец файла отрывка (событие pause приходит перед ended): это не пауза пользователя.
    if (track === "clip" && audio.ended) return;
    dispatch("externalPause");
  };
  const onPlay = () => {
    if (swapping) return;
    dispatch("externalPlay");
  };
  const onEnded = () => {
    if (track === "clip") backToMain();
  };

  audio.addEventListener("error", onError);
  audio.addEventListener("timeupdate", onTime);
  audio.addEventListener("pause", onPause);
  audio.addEventListener("play", onPlay);
  audio.addEventListener("ended", onEnded);
  audio.addEventListener("loadedmetadata", onMeta);

  return {
    getStatus: () => status,
    getTrack: () => track,

    async start() {
      if (status === "error") return;
      try {
        if (context.state === "suspended") await context.resume();
        await audio.play();
        dispatch("start");
      } catch {
        dispatch("fail");
      }
    },

    // Итог задаётся явно, а не переключением: событие play/pause элемента может прийти
    // и до, и после этого кода, и «toggle» тогда перевернул бы статус обратно.
    toggle() {
      if (status === "idle" || status === "error") return;
      if (status === "playing") {
        audio.pause();
        dispatch("externalPause"); // playing -> paused; повторное событие pause ничего не меняет
      } else {
        audio.play().then(
          () => {
            // Пока ждали, музыку могли снова поставить на паузу: тогда статус не трогаем.
            if (!audio.paused) dispatch("start"); // start: любой статус, кроме error, -> playing
          },
          (err: unknown) => {
            // AbortError: play() прервали паузой, это не поломка.
            if (isAbort(err)) return;
            // Отрывок не продолжился: возвращаемся к основному треку, а не ломаем плеер.
            if (track === "clip") {
              dispatch("start");
              return backToMain();
            }
            dispatch("fail");
          },
        );
      }
    },

    enterClip() {
      if (disposed || !clip || clipState !== "pending" || track === "clip") return;
      // Если она поставила музыку на паузу (или музыки нет), ничего не включаем.
      if (status !== "playing") return;
      const gen = ++generation;
      mainPosition = audio.currentTime;
      setTrack("clip");
      swapping = true;
      audio.pause();
      load(clip.src, clip.startAt, false);
      audio.play().then(
        () => {
          if (gen !== generation) return;
          swapping = false;
          if (!audio.paused) dispatch("start");
        },
        (err: unknown) => {
          if (gen !== generation) return;
          swapping = false;
          // Пауза пользователя, пока отрывок загружался: остаёмся на отрывке, на паузе.
          if (isAbort(err) && status === "paused") return;
          // Нет файла или любой другой отказ: тихо возвращаем основной трек.
          backToMain();
        },
      );
    },

    exitClip() {
      backToMain();
    },

    setMuffle(enabled: boolean) {
      filter.type = enabled ? "lowpass" : "allpass";
      filter.frequency.setValueAtTime(enabled ? 500 : 20000, context.currentTime);
    },

    dispose() {
      disposed = true;
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onMeta);
    },
  };
}
