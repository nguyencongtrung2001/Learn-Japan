import Link from "next/link";

const modes = [
  {
    href: "/alphabet",
    icon: "🔠",
    title: "Bảng chữ cái",
    titleJp: "五十音図",
    description: "Tra cứu và làm quen với toàn bộ bảng chữ cái Hiragana, Katakana, Dakuten và Youon.",
    gradient: "from-pink-500/20 to-purple-500/20",
    borderColor: "border-pink-500/30",
    hoverShadow: "hover:shadow-pink-500/10",
  },
  {
    href: "/kana-to-romaji",
    icon: "✍️",
    title: "Kana → Romaji",
    titleJp: "仮名 → ローマ字",
    description: "Xem ký tự tiếng Nhật và nhập cách đọc bằng Romaji. Kiểm tra ngay lập tức.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    hoverShadow: "hover:shadow-blue-500/10",
  },
  {
    href: "/romaji-to-kana",
    icon: "🔤",
    title: "Romaji → Kana",
    titleJp: "ローマ字 → 仮名",
    description: "Xem từ Romaji và nhập ký tự Hiragana hoặc Katakana tương ứng.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
    hoverShadow: "hover:shadow-emerald-500/10",
  },
  {
    href: "/folders",
    icon: "📂",
    title: "Bộ thẻ của tôi",
    titleJp: "マイデッキ",
    description: "Tạo thư mục và thẻ từ vựng riêng. Ôn tập với Quiz ABCD, SRS và âm thanh.",
    gradient: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    hoverShadow: "hover:shadow-amber-500/10",
  },
];

const kanaPreview = [
  { char: "あ", romaji: "a" },
  { char: "い", romaji: "i" },
  { char: "う", romaji: "u" },
  { char: "え", romaji: "e" },
  { char: "お", romaji: "o" },
  { char: "か", romaji: "ka" },
  { char: "き", romaji: "ki" },
  { char: "く", romaji: "ku" },
  { char: "け", romaji: "ke" },
  { char: "こ", romaji: "ko" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-16 overflow-hidden">
      {/* Hero Section */}
      <section className="text-center mb-16 sm:mb-24" id="hero-section">
        <div className="relative">
          <div className="absolute inset-0 -top-8 flex items-center justify-center opacity-[0.04] pointer-events-none select-none overflow-hidden">
            <span className="text-[12rem] sm:text-[20rem] font-black kana-display leading-none">
              仮名
            </span>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sakura/10 border border-sakura/20 text-sakura-light text-sm mb-6 animate-fade-in">
              <span className="animate-float inline-block">🌸</span>
              Học bảng chữ cái tiếng Nhật
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-4 animate-fade-in-up">
              <span className="gradient-text">Kana Master</span>
            </h1>

            <p className="kana-display text-2xl sm:text-3xl text-foreground-muted mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              仮名マスター
            </p>

            <p
              className="text-foreground-muted max-w-lg mx-auto text-sm sm:text-base mb-8 animate-fade-in-up opacity-0"
              style={{ animationDelay: "0.2s" }}
            >
              Luyện tập Hiragana, Katakana, Dakuten & Youon với 4 chế độ học
              tương tác. Tạo bộ thẻ từ vựng riêng và ôn tập thông minh.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-in-up opacity-0"
              style={{ animationDelay: "0.3s" }}
            >
              <Link
                href="/alphabet"
                className="btn-shine px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sakura to-indigo text-white font-semibold
                           hover:shadow-xl hover:shadow-sakura/20 hover:scale-105 transition-all duration-300"
                id="hero-start-btn"
              >
                🚀 Bắt đầu học ngay
              </Link>
              <a
                href="#modes-section"
                className="px-6 py-3.5 rounded-2xl border border-border text-foreground-muted font-medium
                           hover:bg-surface-hover hover:text-foreground transition-all duration-200"
              >
                Xem các chế độ ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Kana Preview Strip */}
      <section className="mb-16 sm:mb-24 overflow-hidden" id="kana-preview">
        <div className="flex gap-3 justify-center flex-wrap">
          {kanaPreview.map((k, i) => (
            <div
              key={k.char}
              className="glass-card px-4 py-3 flex flex-col items-center gap-1 opacity-0 animate-fade-in hover:!border-sakura/40"
              style={{ animationDelay: `${0.4 + i * 0.06}s` }}
            >
              <span className="kana-display text-2xl font-bold text-foreground">
                {k.char}
              </span>
              <span className="text-xs text-foreground-dim">{k.romaji}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Study Modes */}
      <section className="mb-16 sm:mb-24" id="modes-section">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          4 Chế độ luyện tập
        </h2>
        <p className="text-foreground-muted text-center mb-10 text-sm max-w-md mx-auto">
          Kết hợp nhiều phương pháp giúp ghi nhớ lâu hơn và hiệu quả hơn
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {modes.map((mode, index) => (
            <Link
              key={mode.href}
              href={mode.href}
              className={`
                glass-card p-6 flex flex-col group
                opacity-0 animate-fade-in-up
                hover:!shadow-2xl ${mode.hoverShadow}
              `}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              id={`mode-card-${index}`}
            >
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block w-fit">
                {mode.icon}
              </span>
              <h3 className="font-bold text-lg text-foreground mb-1">
                {mode.title}
              </h3>
              <p className="text-foreground-dim text-xs mb-3">
                {mode.titleJp}
              </p>
              <p className="text-foreground-muted text-sm flex-1">
                {mode.description}
              </p>
              <div className="mt-4 flex items-center text-indigo-light text-sm font-medium group-hover:gap-2 gap-1 transition-all duration-200">
                Bắt đầu
                <span className="group-hover:translate-x-1 transition-transform duration-200">
                  →
                </span>
              </div>
            </Link>
          ))}
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
              { icon: "🎲", text: "Câu hỏi ngẫu nhiên — không theo thứ tự bảng chữ cái" },
              { icon: "💾", text: "Tự động lưu tiến độ học vào trình duyệt" },
              { icon: "📊", text: "Theo dõi số câu đúng, sai và tỷ lệ chính xác" },
              { icon: "📱", text: "Giao diện đẹp trên cả máy tính và điện thoại" },
              { icon: "🔠", text: "Hỗ trợ đầy đủ: Hiragana, Katakana, Dakuten, Youon" },
              { icon: "⚡", text: "Nhanh, nhẹ — không cần cơ sở dữ liệu" },
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
