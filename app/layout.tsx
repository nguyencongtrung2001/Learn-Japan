import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
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
  icons: {
    icon: [
      { url: "/icon.svg?v=4", type: "image/svg+xml" },
      { url: "/icon-32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico?v=4", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=4",
    apple: "/icon-192.png?v=4",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg?v=4" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png?v=4" />
        <link rel="shortcut icon" href="/favicon.ico?v=4" />
        <link rel="apple-touch-icon" href="/icon-192.png?v=4" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('app_theme');
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.classList.remove('dark');
                  }
                  var l = localStorage.getItem('app_language');
                  if (l) document.documentElement.lang = l;
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-transparent">
        <ThemeProvider>
          <LanguageProvider>
            <BackgroundProvider>
              <BackgroundVideo />
              <Header />
              <main className="flex-1 relative z-10">{children}</main>
              <BackgroundSelector />
            </BackgroundProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
