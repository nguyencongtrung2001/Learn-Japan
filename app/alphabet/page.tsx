import { Metadata } from "next";
import { AlphabetContainer } from "@/components/alphabet/alphabet-container";

export const metadata: Metadata = {
  title: "Bảng Chữ Cái Tiếng Nhật — Hiragana & Katakana | Flashcard App",
  description:
    "Học bảng chữ cái tiếng Nhật Hiragana, Katakana, Âm đục (Dakuten), Âm bán đục (Handakuten), Âm ghép (Youon), Âm ngắt và Trường âm qua flashcard 3D và bài luyện tập phản xạ.",
};

export default function AlphabetPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] pb-12">
      <AlphabetContainer />
    </main>
  );
}
