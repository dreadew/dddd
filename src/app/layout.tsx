import type { Metadata, Viewport } from "next";
import { Lora } from "next/font/google";
import { AudioProvider } from "@/components/AudioProvider";
import "./globals.css";

// Одна серифная гарнитура на весь сайт: заголовки, текст, кнопки, плеер.
// Lora вариативная (400–700) и с курсивом, кириллица читается и на мелких размерах.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Для тебя",
  description: "Небольшой интерактив",
};

export const viewport: Viewport = {
  themeColor: "#0b1026",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
