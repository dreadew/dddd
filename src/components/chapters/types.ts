import type { Chapter } from "@/content/chapters";

export type ChapterBodyProps = {
  chapter: Chapter;
  name: string;
  answers: (number | null)[];
  onAnswer: (questionIndex: number, optionIndex: number) => void;
  // Ответ «да» в главе «Вопрос»: открывает финал.
  onYes?: () => void;
};
