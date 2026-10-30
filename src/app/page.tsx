"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { ChapterShell } from "@/components/ChapterShell";
import { Gate } from "@/components/Gate";
import { Player } from "@/components/Player";
import { Sky } from "@/components/Sky";
import { Evening } from "@/components/chapters/Evening";
import { Finale } from "@/components/chapters/Finale";
import { Night } from "@/components/chapters/Night";
import { Places } from "@/components/chapters/Places";
import { Question } from "@/components/chapters/Question";
import { Talk } from "@/components/chapters/Talk";
import type { ChapterBodyProps } from "@/components/chapters/types";
import { chapters, talkQuestions, type ChapterId } from "@/content/chapters";
import { fillName, getHerName } from "@/lib/config";

const herName = getHerName(process.env.NEXT_PUBLIC_HER_NAME);

function DefaultBody({ chapter, name }: ChapterBodyProps) {
  return (
    <div className="flex flex-col gap-4 text-center text-lg leading-relaxed">
      {chapter.lines.map((line, i) => (
        <p key={i}>{fillName(line, name)}</p>
      ))}
    </div>
  );
}

const noop = () => {};

function QuestionBody({ chapter, name, onYes }: ChapterBodyProps) {
  return <Question chapter={chapter} name={name} onYes={onYes ?? noop} />;
}

function FinaleBody({ chapter, name, answers }: ChapterBodyProps) {
  return <Finale chapter={chapter} name={name} answers={answers} />;
}

// Компоненты глав; для главы без записи рисуется DefaultBody.
const chapterBodies: Partial<Record<ChapterId, ComponentType<ChapterBodyProps>>> = {
  evening: Evening,
  talk: Talk,
  places: Places,
  night: Night,
  question: QuestionBody,
  finale: FinaleBody,
};

export default function Home() {
  const [started, setStarted] = useState(false);
  // Ответы из главы «Разговор»: индекс выбранного варианта или null; финал на них ссылается.
  const [answers, setAnswers] = useState<(number | null)[]>(() => talkQuestions.map(() => null));

  const onAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => prev.map((v, i) => (i === questionIndex ? optionIndex : v)));
  }, []);

  // Финал скрыт, пока в «Вопросе» не нажато «да».
  const [saidYes, setSaidYes] = useState(false);
  const onYes = useCallback(() => setSaidYes(true), []);

  // После ухода стартового экрана фокус переходит к первой главе, без прокрутки.
  useEffect(() => {
    if (started) document.getElementById(chapters[0].id)?.focus({ preventScroll: true });
  }, [started]);

  useEffect(() => {
    if (!saidYes) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = requestAnimationFrame(() => {
      document
        .getElementById("finale")
        ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [saidYes]);

  return (
    <>
      <Sky />
      {started ? (
        <>
          <main data-snap className="relative z-10 flex flex-col">
            {chapters.map((chapter) => {
              if (chapter.id === "finale" && !saidYes) return null;
              const Body = chapterBodies[chapter.id] ?? DefaultBody;
              return (
                <ChapterShell key={chapter.id} chapter={chapter}>
                  <Body chapter={chapter} name={herName} answers={answers} onAnswer={onAnswer} onYes={onYes} />
                </ChapterShell>
              );
            })}
          </main>
          <Player />
        </>
      ) : (
        <Gate onStart={() => setStarted(true)} />
      )}
    </>
  );
}
