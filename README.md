# Для тебя

Небольшой интерактивный сайт на Next.js: шесть глав, музыка и вопрос в конце. Все тексты лежат в `src/content/chapters.ts`.

## Имя

1. Скопируй `.env.example` в `.env.local`.
2. Впиши имя: `NEXT_PUBLIC_HER_NAME=Имя`.

Если имя пустое или равно заглушке `Имя`, везде подставится «ты» (заглушка игнорируется). Поэтому впиши настоящее имя в `.env.local` и в переменные окружения на Vercel, затем сделай Redeploy. Имя вшивается при сборке, поэтому после правки перезапусти `npm run dev`.

## Трек

Название, исполнитель и файл трека лежат в `src/content/track.ts`:

```ts
export const track = {
  title: "Sweet Creature",
  artist: "Harry Styles",
  src: "/sweet-creature.mp3",
};
```

1. Положи mp3 в папку `public/` под именем из `src` (сейчас `public/sweet-creature.mp3`).
2. Чтобы поменять песню, положи другой файл в `public/` и поправь в `track.ts` все три поля: `title` и `artist` показываются в плеере, `src` это путь к файлу от `public/` (начинается с `/`).

Без файла сайт работает, плеер просто покажет, что музыка недоступна.

## Команды

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # тесты
npm run build   # production-сборка
```

## Деплой на Vercel

1. Импортируй репозиторий на vercel.com.
2. В Settings -> Environment Variables добавь `NEXT_PUBLIC_HER_NAME` с нужным именем.
3. Задеплой. Если меняешь переменную позже, сделай Redeploy: значение вшивается при сборке.
