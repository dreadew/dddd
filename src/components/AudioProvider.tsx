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
import { track } from "@/content/track";
import { createAudioController, type AudioController } from "@/lib/audio-controller";
import type { AudioStatus } from "@/lib/audio-state";

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
  const controllerRef = useRef<AudioController | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.src = track.src;
    const controller = createAudioController(audio, {
      onStatus: setStatus,
      onProgress: setProgress,
    });
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      audio.pause();
      audio.removeAttribute("src");
      controllerRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    await controllerRef.current?.start();
  }, []);

  const toggle = useCallback(() => {
    controllerRef.current?.toggle();
  }, []);

  const value = useMemo(
    () => ({ status, progress, start, toggle }),
    [status, progress, start, toggle],
  );

  return <AudioContext_.Provider value={value}>{children}</AudioContext_.Provider>;
}
