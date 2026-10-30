import type { Chapter } from "@/content/chapters";

export type ChapterBodyProps = {
  chapter: Chapter;
  name: string;
  // Ответ на вопрос «ночной город или рассвет»: индекс варианта или null.
  answer: number | null;
  onAnswer: (optionIndex: number) => void;
  // Ответ «да» в главе «Вопрос»: открывает финал.
  onYes?: () => void;
};
