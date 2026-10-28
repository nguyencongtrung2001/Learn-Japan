import Link from "next/link";
import { InteractiveHeroCard } from "@/components/home/interactive-hero-card";
import { getGlobalMasteryStats } from "@/actions/card-actions";

export default async function HomePage() {
  const masteryStats = await getGlobalMasteryStats();

  return (
    <main className="relative flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-10">
      {/* Background ambient light effects */}
      <div className="pointer-events-none absolute -left-20 top-1/4 -z-10 h-72 w-72 rounded-full bg-indigo/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 -z-10 h-72 w-72 rounded-full bg-sakura/15 blur-[120px]" />

      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* ═══════ CỘT TRÁI: TIÊU ĐỀ & HÀNH ĐỘNG ═══════ */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Top pill badge */}
            <div className="animate-fade-in mb-4 inline-flex items-center gap-2 rounded-full border border-indigo/30 bg-surface/80 px-4 py-1.5 text-xs sm:text-sm font-semibold text-indigo-light shadow-md backdrop-blur-md">
              <span className="animate-float inline-block">🚀</span>
              Spaced Repetition • Ghi nhớ thông minh
            </div>

            {/* Main Hero Headline */}
            <h1 className="animate-fade-in-up mb-4 text-3xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-black tracking-tight leading-[1.12]">
              Học Từ Vựng Nhanh, <br />
              <span className="gradient-text">Ghi Nhớ Bền Vững</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up mb-7 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-foreground-muted">
              Tạo bộ thẻ từ vựng của riêng bạn, ôn tập với thuật toán lặp lại ngắt quãng (SRS), luyện phát âm và nhớ từ vĩnh viễn với bài tập trắc nghiệm đa dạng.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <Link
                href="/folders"
                className="btn-shine group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald to-teal-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-emerald/25 transition-all duration-300 hover:scale-105 active:scale-95"
                id="hero-start-btn"
              >
                <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-y-0" />
                <span className="relative flex items-center gap-2">
                  <span>📂</span>
                  Bắt Đầu Học Ngay
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/tracker"
                className="flex items-center gap-2 rounded-2xl border border-border bg-surface/70 px-6 py-3.5 text-base font-semibold text-foreground-muted backdrop-blur-md transition-all duration-200 hover:border-indigo/40 hover:bg-surface-hover hover:text-foreground"
              >
                <span>📅</span>
                Lịch Ôn Tập
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
