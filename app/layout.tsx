import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
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
  title: "Flashcard App — Master English Vocabulary",
  description:
    "Ứng dụng học từ vựng tiếng Anh. Luyện tập với Flashcard, Spaced Repetition và Quiz tương tác.",
  keywords: [
    "Flashcard",
    "English",
    "học tiếng Anh",
    "từ vựng tiếng Anh",
    "Vocabulary",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html
        lang="vi"
        className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                  document.documentElement.setAttribute('data-theme', 'light')
                } else {
                  document.documentElement.removeAttribute('data-theme')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-transparent">
        <ThemeProvider>
          <BackgroundProvider>
            <BackgroundVideo />
            <BackgroundSelector />
            <Header />
            <main className="flex-1 relative z-10">{children}</main>
            <footer className="border-t border-border/20 py-6 mt-auto relative z-10">
              <div className="mx-auto max-w-6xl px-4 text-center">
                <p className="text-foreground-dim text-xs font-medium">
                  📚 Flashcard App — Master English Vocabulary
                </p>
              </div>
            </footer>
          </BackgroundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
