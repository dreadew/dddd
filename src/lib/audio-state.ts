export type AudioStatus = "idle" | "playing" | "paused" | "error";
export type AudioEvent = "start" | "toggle" | "fail" | "externalPause" | "externalPlay";

export function nextStatus(current: AudioStatus, event: AudioEvent): AudioStatus {
  if (event === "fail") return "error";
  if (current === "error") return "error";
  if (event === "start") return "playing";
  // События самого элемента (звонок, экран блокировки, наушники): idle/error не оживляют.
  if (event === "externalPause") return current === "playing" ? "paused" : current;
  if (event === "externalPlay") return current === "paused" ? "playing" : current;
  // toggle
  if (current === "playing") return "paused";
  if (current === "paused") return "playing";
  return current; // idle: pause/scroll never starts music
}
