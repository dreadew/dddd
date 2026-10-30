export function getHerName(raw?: string): string {
  const name = raw?.trim();
  // Литерал-заглушка «Имя» из .env.example считается незаданным именем.
  if (!name || name.toLowerCase() === "имя") return "ты";
  return name;
}

export function fillName(text: string, name: string): string {
  return text.split("{name}").join(name);
}
