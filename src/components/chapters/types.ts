import type { Chapter } from "@/content/chapters";

export type ChapterBodyProps = {
  chapter: Chapter;
  name: string;
  // Ответ «да» в главе «Вопрос»: открывает финал.
  onYes?: () => void;
};
