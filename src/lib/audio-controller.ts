import { nextStatus, type AudioEvent, type AudioStatus } from "./audio-state";

// Ровно то, что контроллеру нужно от HTMLAudioElement: так его можно проверить подделкой в Node.
export type AudioLike = {
  paused: boolean;
  currentTime: number;
  duration: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
};

export type AudioController = {
  getStatus(): AudioStatus;
  start(): Promise<void>;
  toggle(): void;
  dispose(): void;
};

export function createAudioController(
  audio: AudioLike,
  handlers: { onStatus(status: AudioStatus): void; onProgress?(progress: number): void },
): AudioController {
  let status: AudioStatus = "idle";

  let disposed = false;

  const dispatch = (event: AudioEvent) => {
    if (disposed) return;
    status = nextStatus(status, event);
    handlers.onStatus(status);
  };

  const onError = () => dispatch("fail");
  const onTime = () => {
    if (audio.duration > 0 && isFinite(audio.duration)) {
      handlers.onProgress?.(Math.min(1, audio.currentTime / audio.duration));
    }
  };
  const onPause = () => dispatch("externalPause");
  const onPlay = () => dispatch("externalPlay");

  audio.addEventListener("error", onError);
  audio.addEventListener("timeupdate", onTime);
  audio.addEventListener("pause", onPause);
  audio.addEventListener("play", onPlay);

  return {
    getStatus: () => status,

    async start() {
      if (status === "error") return;
      try {
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
            if (err instanceof DOMException && err.name === "AbortError") return;
            dispatch("fail");
          },
        );
      }
    },

    dispose() {
      disposed = true;
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    },
  };
}
