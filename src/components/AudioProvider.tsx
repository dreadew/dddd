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
import { featuredClip, track } from "@/content/track";
import {
  createAudioController,
  type AudioController,
  type TrackKind,
} from "@/lib/audio-controller";
import type { AudioStatus } from "@/lib/audio-state";

type AudioApi = {
  status: AudioStatus;
  progress: number;
  // Что звучит сейчас: основной трек или отрывок в главе «Наши места».
  track: TrackKind;
  start(): Promise<void>;
  toggle(): void;
  enterClip(): void;
  exitClip(): void;
};

const AudioContext_ = createContext<AudioApi>({
  status: "idle",
  progress: 0,
  track: "main",
  start: async () => {},
  toggle: () => {},
  enterClip: () => {},
  exitClip: () => {},
});

export function useAudio(): AudioApi {
  return useContext(AudioContext_);
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState<TrackKind>("main");
  const controllerRef = useRef<AudioController | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.src = track.src;
    const controller = createAudioController(
      audio,
      {
        onStatus: setStatus,
        onProgress: setProgress,
        onTrack: (t) => {
          setCurrent(t);
          setProgress(0);
        },
      },
      { mainSrc: track.src, clip: featuredClip },
    );
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

  const enterClip = useCallback(() => {
    controllerRef.current?.enterClip();
  }, []);

  const exitClip = useCallback(() => {
    controllerRef.current?.exitClip();
  }, []);

  const value = useMemo(
    () => ({ status, progress, track: current, start, toggle, enterClip, exitClip }),
    [status, progress, current, start, toggle, enterClip, exitClip],
  );

  return <AudioContext_.Provider value={value}>{children}</AudioContext_.Provider>;
}
