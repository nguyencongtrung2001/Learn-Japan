import KanaChart from "@/components/kana-chart";

export default function AlphabetPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Page header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo/10 text-indigo-light mb-4">
          <span className="text-3xl">🔠</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="gradient-text">Bảng chữ cái tiếng Nhật</span>
        </h1>
        <p className="text-foreground-muted text-sm sm:text-base max-w-2xl mx-auto">
          Tra cứu toàn bộ bảng chữ cái Hiragana, Katakana, bao gồm cả các âm đục (Dakuten) và âm ghép (Youon). Nhấn vào chữ cái để xem chi tiết.
        </p>
      </div>

      {/* Kana Chart component */}
      <KanaChart />
    </div>
  );
}
