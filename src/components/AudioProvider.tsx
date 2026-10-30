"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { nextStatus, type AudioEvent, type AudioStatus } from "@/lib/audio-state";

const SRC = "/we-fell-in-love-in-october.mp3";

type AudioApi = {
  status: AudioStatus;
  progress: number;
  start(): Promise<void>;
  toggle(): void;
};

const AudioContext_ = createContext<AudioApi>({
  status: "idle",
  progress: 0,
  start: async () => {},
  toggle: () => {},
});

export function useAudio(): AudioApi {
  return useContext(AudioContext_);
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const statusRef = useRef<AudioStatus>("idle");

  const dispatch = useCallback((event: AudioEvent) => {
    const next = nextStatus(statusRef.current, event);
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.src = SRC;
    audioRef.current = audio;

    const onError = () => dispatch("fail");
    const onTime = () => {
      if (audio.duration > 0 && isFinite(audio.duration)) {
        setProgress(Math.min(1, audio.currentTime / audio.duration));
      }
    };
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTime);
    const onPause = () => dispatch("externalPause");
    const onPlay = () => dispatch("externalPlay");
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
    };
  }, [dispatch]);

  const start = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || statusRef.current === "error") return;
    try {
      await audio.play();
      dispatch("start");
    } catch {
      dispatch("fail");
    }
  }, [dispatch]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    const current = statusRef.current;
    if (!audio || current === "idle" || current === "error") return;
    if (current === "playing") {
      audio.pause();
      dispatch("toggle");
    } else {
      audio.play().then(
        () => dispatch("toggle"),
        () => dispatch("fail"),
      );
    }
  }, [dispatch]);

  const value = useMemo(
    () => ({ status, progress, start, toggle }),
    [status, progress, start, toggle],
  );

  return <AudioContext_.Provider value={value}>{children}</AudioContext_.Provider>;
}
