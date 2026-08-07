import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import Header from "@/components/header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Kana Master 仮名マスター — Học bảng chữ cái tiếng Nhật",
  description:
    "Ứng dụng học bảng chữ cái tiếng Nhật miễn phí. Luyện tập Hiragana, Katakana, Dakuten và Youon với Flashcard và Quiz tương tác.",
  keywords: [
    "Hiragana",
    "Katakana",
    "học tiếng Nhật",
    "bảng chữ cái tiếng Nhật",
    "Kana",
    "flashcard",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 mt-auto">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <p className="text-foreground-dim text-xs">
              🌸 Kana Master 仮名マスター — Học bảng chữ cái tiếng Nhật mỗi
              ngày
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
