"use client";

import { useState, type ComponentType } from "react";
import { ChapterShell } from "@/components/ChapterShell";
import { Gate } from "@/components/Gate";
import { Player } from "@/components/Player";
import { Sky } from "@/components/Sky";
import { chapters, type Chapter, type ChapterId } from "@/content/chapters";
import { fillName, getHerName } from "@/lib/config";

const herName = getHerName(process.env.NEXT_PUBLIC_HER_NAME);

type ChapterBodyProps = { chapter: Chapter; name: string };

function DefaultBody({ chapter, name }: ChapterBodyProps) {
  return (
    <div className="flex flex-col gap-4 text-center text-lg leading-relaxed">
      {chapter.lines.map((line, i) => (
        <p key={i}>{fillName(line, name)}</p>
      ))}
    </div>
  );
}

// Сюда главы будут подключать свои компоненты (задачи 5-6); без записи рисуется DefaultBody.
const chapterBodies: Partial<Record<ChapterId, ComponentType<ChapterBodyProps>>> = {};

export default function Home() {
  const [started, setStarted] = useState(false);

  return (
    <>
      <Sky />
      {started ? (
        <>
          <main data-snap className="relative z-10 flex flex-col">
            {chapters.map((chapter) => {
              const Body = chapterBodies[chapter.id] ?? DefaultBody;
              return (
                <ChapterShell key={chapter.id} chapter={chapter}>
                  <Body chapter={chapter} name={herName} />
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
