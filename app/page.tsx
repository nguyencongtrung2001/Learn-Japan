import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-16 overflow-hidden">
      {/* Hero Section */}
      <section className="text-center mb-16 sm:mb-24 relative" id="hero-section">
        {/* Glow effect behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        
        <div className="relative">
          <div className="absolute inset-0 -top-8 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
            <span className="text-[10rem] sm:text-[18rem] md:text-[22rem] font-black leading-none tracking-tighter">
              ENGLISH
            </span>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-surface/80 border border-white/10 backdrop-blur-md text-indigo-light text-sm sm:text-base font-semibold mb-8 animate-fade-in shadow-lg">
              <span className="animate-float inline-block">🚀</span>
              Master English Faster
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black mb-6 animate-fade-in-up tracking-tight">
              <span className="gradient-text">Flashcard App</span>
            </h1>

            <p className="text-2xl sm:text-3xl text-foreground-muted mb-6 animate-fade-in-up font-bold" style={{ animationDelay: "0.1s" }}>
              Học Từ Vựng Thông Minh
            </p>

            <p
              className="text-foreground-muted max-w-xl mx-auto text-base sm:text-lg mb-10 animate-fade-in-up opacity-0 leading-relaxed"
              style={{ animationDelay: "0.2s" }}
            >
              Tạo bộ thẻ từ vựng của riêng bạn, ôn tập thông minh với thuật toán lặp lại ngắt quãng (Spaced Repetition), luyện phát âm và nhớ từ vĩnh viễn.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up opacity-0"
              style={{ animationDelay: "0.3s" }}
            >
              <Link
                href="/folders"
                className="btn-shine group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald to-teal-500 text-white font-bold text-lg
                           hover:shadow-2xl hover:shadow-emerald/30 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
                id="hero-start-btn"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  📂 Bắt Đầu Học Ngay
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16 animate-fade-in-up" style={{ animationDelay: "0.4s" }} id="features-section">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold gradient-text inline-block">
            ✨ Tính Năng Nổi Bật
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: "📁", title: "Quản Lý Thư Mục", text: "Tổ chức và phân loại từ vựng theo chủ đề dễ dàng", color: "from-blue-500/10 to-indigo/10 border-blue-500/20" },
            { icon: "🧠", title: "Lặp Lại Ngắt Quãng", text: "Thuật toán Spaced Repetition giúp nhớ từ vĩnh viễn", color: "from-emerald/10 to-teal-500/10 border-emerald/20" },
            { icon: "🔊", title: "Luyện Phát Âm", text: "Tích hợp Text-to-Speech đọc chuẩn giọng bản xứ", color: "from-sakura/10 to-rose/10 border-sakura/20" },
            { icon: "✍️", title: "Đa Dạng Bài Tập", text: "Ôn tập qua trắc nghiệm, gõ từ và viết câu thực tế", color: "from-amber-500/10 to-orange-500/10 border-amber-500/20" },
            { icon: "⚡", title: "Nhập Liệu Siêu Tốc", text: "Dán trực tiếp hàng loạt từ vựng dạng bảng trong tích tắc", color: "from-purple-500/10 to-fuchsia-500/10 border-purple-500/20" },
            { icon: "📱", title: "Responsive Tuyệt Đối", text: "Trải nghiệm mượt mà trên cả máy tính và điện thoại di động", color: "from-cyan-500/10 to-sky-500/10 border-cyan-500/20" },
          ].map((feature, i) => (
            <div
              key={i}
              className={`glass-card p-6 flex flex-col items-center text-center group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${feature.color}`}
            >
              <div className="w-16 h-16 rounded-2xl bg-surface/80 flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-foreground-muted text-sm leading-relaxed">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
