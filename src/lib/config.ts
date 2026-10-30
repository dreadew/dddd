export function getHerName(raw?: string): string {
  const name = raw?.trim();
  // Литерал-заглушка «Имя» из .env.example считается незаданным именем.
  if (!name || name.toLowerCase() === "имя") return "ты";
  return name;
}

// Предлоги и союзы из одной-двух букв не остаются висеть в конце строки:
// пробел после них становится неразрывным.
const SHORT_WORD = /(?<=^|[\s«(])([а-яёa-z]{1,2}) +/giu;

export function fillName(text: string, name: string): string {
  const filled = text.split("{name}").join(name);
  return filled.replace(SHORT_WORD, "$1\u00a0");
}
