import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-16 overflow-hidden">
      {/* Hero Section */}
      <section className="text-center mb-16 sm:mb-24" id="hero-section">
        <div className="relative">
          <div className="absolute inset-0 -top-8 flex items-center justify-center opacity-[0.04] pointer-events-none select-none overflow-hidden">
            <span className="text-[12rem] sm:text-[20rem] font-black leading-none">
              VOCAB
            </span>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo/10 border border-indigo/20 text-indigo-light text-sm mb-6 animate-fade-in">
              <span className="animate-float inline-block">🚀</span>
              Học từ vựng Tiếng Anh hiệu quả
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-4 animate-fade-in-up">
              <span className="gradient-text">Flashcard App</span>
            </h1>

            <p className="text-2xl sm:text-3xl text-foreground-muted mb-4 animate-fade-in-up font-bold" style={{ animationDelay: "0.1s" }}>
              Master English Vocabulary
            </p>

            <p
              className="text-foreground-muted max-w-lg mx-auto text-sm sm:text-base mb-8 animate-fade-in-up opacity-0"
              style={{ animationDelay: "0.2s" }}
            >
              Tạo bộ thẻ từ vựng của riêng bạn, ôn tập thông minh với thuật toán lặp lại ngắt quãng (Spaced Repetition), luyện phát âm và nhớ từ lâu hơn.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-in-up opacity-0"
              style={{ animationDelay: "0.3s" }}
            >
              <Link
                href="/folders"
                className="btn-shine px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald to-teal-500 text-white font-semibold
                           hover:shadow-xl hover:shadow-emerald/20 hover:scale-105 transition-all duration-300"
                id="hero-start-btn"
              >
                📂 Mở Bộ Thẻ Của Tôi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16" id="features-section">
        <div className="glass-card p-8 sm:p-10 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-6 gradient-text">
            ✨ Tính năng nổi bật
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "📁", text: "Tổ chức từ vựng theo thư mục thông minh" },
              { icon: "🧠", text: "Thuật toán lặp lại ngắt quãng (Spaced Repetition)" },
              { icon: "🔊", text: "Phát âm từ vựng chuẩn (Text-to-Speech)" },
              { icon: "✍️", text: "Các chế độ học: Trắc nghiệm, Gõ từ, Luyện trí nhớ" },
              { icon: "📥", text: "Import danh sách từ vựng nhanh từ file Excel" },
              { icon: "📱", text: "Giao diện hiện đại trên cả máy tính và điện thoại" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-hover/50 transition-colors"
              >
                <span className="text-xl">{feature.icon}</span>
                <span className="text-foreground-muted text-sm">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
