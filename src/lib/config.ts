export function getHerName(raw?: string): string {
  const name = raw?.trim();
  return name ? name : "ты";
}

export function fillName(text: string, name: string): string {
  return text.split("{name}").join(name);
}
