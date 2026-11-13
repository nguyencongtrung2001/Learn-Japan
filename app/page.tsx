import Link from "next/link";
import { InteractiveHeroCard } from "@/components/home/interactive-hero-card";
import { getGlobalMasteryStats } from "@/actions/card-actions";

export default async function HomePage() {
  const masteryStats = await getGlobalMasteryStats();

  return (
    <main className="relative flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] w-full items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* ═══════ CỘT TRÁI: TIÊU ĐỀ & HÀNH ĐỘNG ═══════ */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Top pill badge */}
            <div className="animate-fade-in mb-4 inline-flex items-center gap-2 rounded-full border border-[#E2E4E9] bg-white px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#4255FF] shadow-sm">
              <span className="animate-float inline-block">🚀</span>
              Spaced Repetition • Ghi nhớ thông minh
            </div>

            {/* Main Hero Headline */}
            <h1 className="animate-fade-in-up mb-4 text-3xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-black tracking-tight leading-[1.12] text-[#1A1D28]">
              Học Từ Vựng Nhanh, <br />
              <span className="gradient-text">Ghi Nhớ Bền Vững</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up mb-7 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-[#586380]">
              Tạo bộ thẻ từ vựng của riêng bạn, ôn tập với thuật toán lặp lại ngắt quãng (SRS), luyện phát âm và nhớ từ vĩnh viễn với bài tập trắc nghiệm đa dạng.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <Link
                href="/folders"
                className="btn-shine group relative overflow-hidden rounded-2xl bg-[#4255FF] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-[#4255FF]/20 transition-all duration-300 hover:scale-105 hover:bg-[#3344DD] active:scale-95"
                id="hero-start-btn"
              >
                <span className="relative flex items-center gap-2">
                  Bắt Đầu Học Ngay
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/alphabet"
                className="flex items-center gap-2 rounded-2xl border border-[#E2E4E9] bg-white px-6 py-3.5 text-base font-bold text-[#1A1D28] transition-all duration-200 hover:border-[#4255FF]/40 hover:shadow-md hover:scale-105 active:scale-95"
              >
                🇯🇵 Bảng Chữ Cái
              </Link>

              <Link
                href="/tracker"
                className="flex items-center gap-2 rounded-2xl border border-[#E2E4E9] bg-white px-6 py-3.5 text-base font-semibold text-[#586380] transition-all duration-200 hover:border-[#4255FF]/40 hover:text-[#1A1D28] hover:shadow-md"
              >
                📅 Lịch Ôn Tập
              </Link>
            </div>
          </div>

          {/* ═══════ CỘT PHẢI: INTERACTIVE DEMO CARD ═══════ */}
          <div className="flex justify-center lg:col-span-5">
            <InteractiveHeroCard initialRetentionRate={masteryStats.retentionRate} />
          </div>
        </div>
      </div>
    </main>
  );
}
