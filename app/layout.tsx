import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/header";
import { BackgroundProvider } from "@/components/background-provider";
import BackgroundVideo from "@/components/background-video";
import BackgroundSelector from "@/components/background-selector";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quizlet — Master Vocabulary",
  description:
    "Ứng dụng học từ vựng tiếng Anh & tiếng Nhật. Luyện tập với Flashcard, Spaced Repetition và Quiz tương tác.",
  keywords: [
    "Flashcard",
    "English",
    "Japanese",
    "học tiếng Anh",
    "từ vựng",
    "Vocabulary",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-transparent">
        <BackgroundProvider>
          <BackgroundVideo />
          <Header />
          <main className="flex-1 relative z-10">{children}</main>
          <BackgroundSelector />
        </BackgroundProvider>
      </body>
    </html>
  );
}
