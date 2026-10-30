# Сайт-предложение «Перед рассветом» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Мобильный романтический сайт-прогулка на Next.js с фоновым треком, плеером и финальным предложением.

**Architecture:** Одна страница `app/page.tsx` со стартовым экраном (жест для аудио) и шестью главами-секциями на весь экран. Тексты в `src/content/chapters.ts`, имя из `NEXT_PUBLIC_HER_NAME`. Аудио в `AudioProvider` (контекст) + закреплённый `Player`. Логика, которую можно проверить без браузера (имя, подстановка в тексты, уворот кнопки «нет»), вынесена в чистые функции с тестами.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-30-proposal-site-design.md`

## Global Constraints

- Язык интерфейса и текстов: русский.
- Стиль A «Ночной город»: тёмно-синее небо, звёзды, огни набережной, серифный курсив как субтитры.
- Mobile-first; десктоп должен выглядеть нормально.
- Её имя только из `NEXT_PUBLIC_HER_NAME` (`.env.local`, образец в `.env.example`); в коде имя не зашито.
- Музыка запускается только после нажатия на стартовом экране; файл `public/we-fell-in-love-in-october.mp3` кладёт автор, без него сайт не падает.
- Без бэкенда, базы данных, аналитики, авторизации; статический сайт.
- Все тексты глав только в `src/content/chapters.ts`.
- Главы: Вечер, Разговор, Наши места, Первая ночь, Вопрос, Финал.

## Review Focus

- `NEXT_PUBLIC_HER_NAME` не задана или пустая: сайт не показывает «undefined», используется нейтральное «ты».
- Файл трека отсутствует или не загрузился: плеер остаётся на месте, кнопка воспроизведения не падает, нет необработанной ошибки.
- Пользователь нажимает паузу, потом листает дальше: музыка не должна запускаться сама.
- Кнопка «нет» на узком экране: ускользает, но всегда остаётся целиком в видимой области.
- Пользователь с `prefers-reduced-motion`: анимации упрощаются, «нет» не прыгает бесконечно, вопрос остаётся отвечаемым.

---

### Task 1: Каркас проекта и конфиг имени

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` (через `create-next-app` в текущей папке), `vitest.config.ts`, `.env.example`, `.env.local`
- Create: `src/lib/config.ts`
- Test: `src/lib/config.test.ts`

**Interfaces:**
- Produces: `getHerName(raw?: string): string` (возвращает обрезанное имя или `"ты"`, если пусто/undefined); `fillName(text: string, name: string): string` (заменяет все `{name}` в тексте).

- [ ] **Step 1: Создать проект** `npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint --no-turbopack --import-alias "@/*"`, затем `npm i framer-motion` и `npm i -D vitest`. Добавить скрипт `"test": "vitest run"`. Проект в непустой папке (есть `docs/`, `.superpowers/`): при отказе создать в подпапке и перенести файлы.
- [ ] **Step 2: Написать тесты** в `src/lib/config.test.ts`: `getHerName("  Аня ") === "Аня"`, `getHerName("") === "ты"`, `getHerName(undefined) === "ты"`, `fillName("{name}, привет, {name}", "Аня") === "Аня, привет, Аня"`.
- [ ] **Step 3: Запустить** `npm test`. Ожидается FAIL (модуля нет).
- [ ] **Step 4: Реализовать** `getHerName` и `fillName` в `src/lib/config.ts`.
- [ ] **Step 5: Запустить** `npm test`. Ожидается PASS.
- [ ] **Step 6: Создать** `.env.example` и `.env.local` со строкой `NEXT_PUBLIC_HER_NAME=Имя`.

### Task 2: Тексты глав и тема

**Files:**
- Create: `src/content/chapters.ts`
- Modify: `src/app/globals.css`, `src/app/layout.tsx` (шрифты: серифный курсив для субтитров, например Cormorant Garamond с кириллицей, и чистый sans для интерфейса; `lang="ru"`)
- Test: `src/content/chapters.test.ts`

**Interfaces:**
- Consumes: `fillName`.
- Produces: `type Chapter = { id: "evening" | "talk" | "places" | "night" | "question" | "finale"; title: string; subtitle: string; lines: string[] }`; `const chapters: Chapter[]` (ровно шесть, в порядке из Global Constraints); `const talkQuestions: { prompt: string; options: [string, string] }[]` (два вопроса: «спорить или молчать?», «ночной город или рассвет?»); `const questionText: { ask: string; yes: string; no: string; noTeases: string[] }`; `const finaleLines: string[]`.

- [ ] **Step 1: Написать тест**: ровно 6 глав с уникальными `id` в нужном порядке; у каждой есть непустые `title` и `lines`; в `questionText.noTeases` не меньше 3 фраз; хотя бы в одном тексте глав есть `{name}`.
- [ ] **Step 2: Запустить** `npm test -- chapters`, ожидается FAIL.
- [ ] **Step 3: Написать тексты** на русском: октябрь, вечера, Кабан, набережная, театр Камала, споры и разговоры, первая ночь и хороший сон вместе (без откровенных подробностей), по одной ненавязчивой отсылке к каждому из трёх фильмов в заголовках/подписях (без длинных цитат). Предложение звучит только в главе «Вопрос». Подписи глав оформить как субтитры.
- [ ] **Step 4: Настроить тему**: цвета фона (градиент от #0b1026 к #3a2a4d), цвет текста #f3e9dc, акцент тёплый оранжевый; шрифты через `next/font/google` с подмножеством `cyrillic`.
- [ ] **Step 5: Запустить** `npm test`, ожидается PASS.

### Task 3: Аудио и плеер

**Files:**
- Create: `src/components/AudioProvider.tsx`, `src/components/Player.tsx`, `public/cover.svg` (заглушка обложки)
- Test: `src/lib/audio-state.test.ts`, `src/lib/audio-state.ts`

**Interfaces:**
- Produces (`audio-state.ts`): `type AudioStatus = "idle" | "playing" | "paused" | "error"`; `nextStatus(current: AudioStatus, event: "start" | "toggle" | "fail"): AudioStatus`.
- Produces (`AudioProvider.tsx`): `AudioProvider` (оборачивает приложение, держит `HTMLAudioElement` на `/we-fell-in-love-in-october.mp3`, loop) и хук `useAudio(): { status: AudioStatus; progress: number; start(): Promise<void>; toggle(): void }`.
- Produces (`Player.tsx`): `Player` — закреплённая снизу панель: обложка, «We Fell in Love in October», «girl in red», полоса прогресса, кнопка пауза/играть.

- [ ] **Step 1: Написать тесты** для `nextStatus`: `idle`+`start`→`playing`; `playing`+`toggle`→`paused`; `paused`+`toggle`→`playing`; любое состояние+`fail`→`error`; `error`+`toggle`→`error`; `idle`+`toggle`→`idle` (пауза не запускает музыку без старта).
- [ ] **Step 2: Запустить** `npm test -- audio-state`, ожидается FAIL.
- [ ] **Step 3: Реализовать** `nextStatus`, затем `AudioProvider` (ошибка `play()` или события `error` у элемента → событие `fail`, без исключений наружу) и `Player` (в состоянии `error` показывает тот же вид, но кнопка отключена).
- [ ] **Step 4: Запустить** `npm test`, ожидается PASS.

### Task 4: Стартовый экран, небо и скролл глав

**Files:**
- Create: `src/components/Gate.tsx`, `src/components/Sky.tsx`, `src/components/ChapterShell.tsx`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx` (оборачивает в `AudioProvider`, рендерит `Player`)

**Interfaces:**
- Consumes: `useAudio`, `getHerName`, `fillName`, `chapters`.
- Produces: `Gate({ onStart }: { onStart: () => void })` (экран «нажми, чтобы начать», нажатие вызывает `start()` и `onStart`); `Sky` (фон: градиент, мерцающие звёзды, огни набережной снизу; реагирует на `useReducedMotion`); `ChapterShell({ chapter, children })` (секция на весь экран с подписью-субтитром, появляется при входе в область видимости).

- [ ] **Step 1: Реализовать** `Gate`, `Sky`, `ChapterShell` и собрать `page.tsx`: пока `started=false` виден только `Gate`; после нажатия показываются главы по порядку с `scroll-snap`.
- [ ] **Step 2: Проверить в браузере** (`npm run dev`, ширина 390px): нажатие запускает состояние `playing` (в консоли нет ошибок даже без mp3), главы листаются, `Player` виден поверх. Ожидается: страница открывается без ошибок.

### Task 5: Главы 1–4

**Files:**
- Create: `src/components/chapters/Evening.tsx`, `Talk.tsx`, `Places.tsx`, `Night.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `chapters`, `talkQuestions`, `ChapterShell`, `fillName`.
- Produces: `Talk({ onAnswer }: { onAnswer: (questionIndex: number, optionIndex: number) => void })` (после выбора ответа показывает короткую реакцию); `page.tsx` хранит `answers: (number | null)[]` и передаёт их в финал.

- [ ] **Step 1: Реализовать** `Evening` (построчное появление текста на фоне звёзд), `Talk` (два вопроса с двумя вариантами), `Places` (силуэты набережной, Кабана и театра Камала в SVG, подписи плавно проявляются), `Night` (затемнение, лёгкое «дыхание» света, тихий текст).
- [ ] **Step 2: Проверить в браузере** (390px и десктоп): все четыре главы читаются, ответы в `Talk` записываются, при `prefers-reduced-motion` анимации упрощены. Ожидается: без ошибок в консоли и без горизонтального скролла.

### Task 6: Вопрос, ускользающее «нет» и финал

**Files:**
- Create: `src/lib/dodge.ts`, `src/components/chapters/Question.tsx`, `src/components/chapters/Finale.tsx`
- Test: `src/lib/dodge.test.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `questionText`, `finaleLines`, `answers`.
- Produces: `type Box = { x: number; y: number; w: number; h: number }`; `dodgePosition(button: Box, pointer: { x: number; y: number }, bounds: Box, margin: number): { x: number; y: number }` (чистая функция: сдвигает кнопку от указателя и всегда оставляет её целиком внутри `bounds` с отступом `margin`); `Question({ onYes }: { onYes: () => void })`; `Finale({ answers })`.

- [ ] **Step 1: Написать тесты** для `dodgePosition`: результат при указателе над кнопкой отличается от текущей позиции; для кнопки у правого края и указателя слева кнопка не выходит за `bounds` (проверка `x + w <= bounds.x + bounds.w - margin` и аналогично для остальных сторон); при `bounds` меньше кнопки возвращается позиция внутри `bounds` без исключения; результат детерминирован для одних и тех же входных данных.
- [ ] **Step 2: Запустить** `npm test -- dodge`, ожидается FAIL.
- [ ] **Step 3: Реализовать** `dodgePosition`.
- [ ] **Step 4: Запустить** `npm test -- dodge`, ожидается PASS.
- [ ] **Step 5: Реализовать** `Question`: кнопка «нет» убегает по `onPointerEnter`/касанию (через `dodgePosition`) и показывает фразы из `noTeases` по кругу; при `prefers-reduced-motion` вместо бегства «нет» сменяется фразами и после нескольких попыток становится неактивной; «да» вызывает `onYes`. Реализовать `Finale`: рассвет (градиент светлеет), падающий свет или листья, финальные строки, ссылка на пару из `answers`.
- [ ] **Step 6: Проверить в браузере**: на 390px «нет» не выходит за экран и не перекрывает «да»; после «да» запускается финал.

### Task 7: Полировка и запуск

**Files:**
- Modify: `src/app/layout.tsx` (метаданные: нейтральный title без раскрытия замысла, например «Для тебя»), `README.md` (как поменять имя и положить трек)
- Create: `public/.gitkeep` не нужен, если `public/` уже есть

- [ ] **Step 1: Прогнать** `npm test`, `npm run lint`, `npm run build`. Ожидается: без ошибок.
- [ ] **Step 2: Пройти весь сценарий** на ширине 390px и на десктопе, с mp3 и без него, с заданным и пустым `NEXT_PUBLIC_HER_NAME`; убедиться в пунктах Review Focus.
- [ ] **Step 3: Описать в README** три вещи: поставить имя в `.env.local`, положить `we-fell-in-love-in-october.mp3` в `public/`, задеплоить на Vercel и добавить `NEXT_PUBLIC_HER_NAME` в переменные окружения.

---

## Self-review

- Покрытие спецификации: стек и стиль (T1, T2), плеер и трек (T3), стартовый экран и мобильность (T4), главы 1–4 (T5), предложение, ускользающее «нет» и финал (T6), деплой и README (T7), имя из `.env` (T1).
- Согласованность имён: `getHerName`, `fillName`, `useAudio`, `nextStatus`, `dodgePosition` используются одинаково во всех задачах.
- Каждая строка Review Focus закреплена: имя (T1), трек (T3), пауза (T3), «нет» на узком экране (T6), reduced motion (T5, T6).

---

## Revision 2026-10-30 (Task 8)

Requested by the author after reviewing the built site: unified serif typography, chapter labels removed, content rewritten from the author's real details (dating-site opener, first date, embankment/water/ducks, dream after the first hike), one Talk question, track switched to a config (default Harry Styles — Sweet Creature), and the audio pause/resume bug fixed. Full requirements: Task 8 brief in the SDD workspace (`task-8-brief.md`).
