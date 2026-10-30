export type AudioStatus = "idle" | "playing" | "paused" | "error";
export type AudioEvent = "start" | "toggle" | "fail";

export function nextStatus(current: AudioStatus, event: AudioEvent): AudioStatus {
  if (event === "fail") return "error";
  if (current === "error") return "error";
  if (event === "start") return "playing";
  // toggle
  if (current === "playing") return "paused";
  if (current === "paused") return "playing";
  return current; // idle: pause/scroll never starts music
}
