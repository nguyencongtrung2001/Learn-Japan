"use client";

import { useState } from "react";

interface QuizSelectModeProps {
  newCount: number;
  dueCount: number;
  learnedCount: number;
  onStartLearn: () => void;
  onStartReview: (limit: number | "all") => void;
  onBack: () => void;
  initialMode?: string;
}

const LIMIT_OPTIONS: { label: string; value: number | "all" }[] = [
  { label: "10 từ", value: 10 },
  { label: "20 từ", value: 20 },
  { label: "50 từ", value: 50 },
  { label: "Tất cả", value: "all" },
];

export function QuizSelectMode({
  newCount,
  dueCount,
  learnedCount,
  onStartLearn,
  onStartReview,
  onBack,
  initialMode,
}: QuizSelectModeProps) {
  const [cramLimit, setCramLimit] = useState<number | "all">(() => {
    if (learnedCount > 0 && learnedCount <= 10) return "all";
    return 10;
  });

  const effectiveCount =
    cramLimit === "all" ? learnedCount : Math.min(cramLimit, learnedCount);

  const isReviewFocused = initialMode === "review";

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="gradient-text mb-2 text-center text-3xl font-bold">Chọn Chế Độ</h1>
      <p className="mb-10 text-center text-sm text-foreground-muted">Học từ mới hoặc ôn tập từ đã học</p>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Card 1: Học từ mới */}
        <div
          className={`glass-card flex flex-col justify-between p-6 transition-all ${
            newCount > 0
              ? "hover:border-emerald/30 hover:shadow-lg hover:shadow-emerald/10"
              : "opacity-50"
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-4xl">🌱</span>
              {newCount > 0 ? (
                <span className="rounded-full bg-emerald/15 px-3 py-1 text-xs font-bold text-emerald">
                  {newCount} từ mới
                </span>
              ) : (
                <span className="rounded-full bg-foreground-muted/10 px-3 py-1 text-xs text-foreground-muted">
                  Đã hết từ mới
                </span>
              )}
            </div>
            <h3 className="mb-1 text-lg font-bold text-foreground">Học từ mới</h3>
            <p className="text-sm text-foreground-muted mb-4">
              {newCount > 0
                ? `Gieo hạt ${newCount} từ vựng mới theo từng lô 5 từ (từ mức 🌰 đến 🌺).`
                : "Tất cả từ đã được học! Thêm thẻ mới hoặc chọn ôn tập."}
            </p>
          </div>

          <button
            type="button"
            onClick={onStartLearn}
            disabled={newCount === 0}
            className={`w-full cursor-pointer rounded-xl py-3 px-4 text-center text-sm font-bold transition-all duration-300 ${
              newCount > 0
                ? "bg-gradient-to-r from-emerald to-teal-500 text-white shadow-md hover:scale-[1.02] hover:shadow-emerald/20 active:scale-95"
                : "cursor-not-allowed bg-foreground-muted/10 text-foreground-muted"
            }`}
          >
            {newCount > 0 ? "Bắt đầu học (5 từ) →" : "Đã học hết"}
          </button>
        </div>

        {/* Card 2: Ôn tập & Luyện tập tự do */}
        <div
          className={`glass-card flex flex-col justify-between p-6 transition-all ${
            isReviewFocused ? "border-sakura/50 shadow-lg shadow-sakura/20 ring-1 ring-sakura/30" : ""
          } ${
            learnedCount > 0
              ? "hover:border-sakura/30 hover:shadow-lg hover:shadow-sakura/10"
              : "opacity-50"
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-4xl">{dueCount > 0 ? "💧" : "⚡"}</span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {dueCount > 0 && (
                  <span className="rounded-full bg-rose-500/15 border border-rose-500/25 px-2.5 py-0.5 text-xs font-bold text-rose-400">
                    💧 {dueCount} đến hạn
                  </span>
                )}
                {learnedCount > 0 && (
                  <span className="rounded-full bg-sakura/15 border border-sakura/25 px-2.5 py-0.5 text-xs font-bold text-sakura-light">
                    📚 {learnedCount} đã học
                  </span>
                )}
              </div>
            </div>

            <h3 className="mb-1 text-lg font-bold text-foreground">
              {dueCount > 0 ? "Ôn tập đến hạn & Tự do" : "⚡ Ôn tập tự do / Cấp tốc"}
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              {dueCount > 0
                ? `Tưới nước ${dueCount} hoa đến hạn và chủ động củng cố thêm từ vựng.`
                : "Luyện tập tự do củng cố trí nhớ trước giờ kiểm tra ngay cả khi chưa đến hạn."}
            </p>

            {/* Bộ chọn số lượng từ ôn tập */}
            {learnedCount > 0 && (
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-foreground-muted">
                  <span>Số lượng từ ôn tập:</span>
                  <span className="text-sakura-light font-bold">
                    {cramLimit === "all" ? `Tất cả (${learnedCount})` : `${cramLimit} từ`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {LIMIT_OPTIONS.map((opt) => {
                    const isSelected = cramLimit === opt.value;
                    const isUnavailable = typeof opt.value === "number" && opt.value > learnedCount;
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => setCramLimit(opt.value)}
                        className={`rounded-lg py-1.5 px-1 text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-sakura text-white shadow-sm shadow-sakura/30 scale-[1.02]"
                            : isUnavailable
                            ? "cursor-not-allowed bg-foreground-muted/5 text-foreground-muted/30 line-through"
                            : "bg-foreground-muted/10 text-foreground-muted hover:bg-sakura/10 hover:text-sakura-light"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ghi chú chế độ an toàn */}
            <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-emerald/10 px-2.5 py-1.5 text-xs text-emerald border border-emerald/20">
              <span className="shrink-0">🛡️</span>
              <span>
                <strong>Chế độ an toàn:</strong> Không phạt tụt cấp hoa khi ôn luyện tự do.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartReview(cramLimit)}
            disabled={learnedCount === 0}
            className={`w-full cursor-pointer rounded-xl py-3 px-4 text-center text-sm font-bold transition-all duration-300 ${
              learnedCount > 0
                ? "bg-gradient-to-r from-sakura to-indigo text-white shadow-md hover:scale-[1.02] hover:shadow-sakura/20 active:scale-95"
                : "cursor-not-allowed bg-foreground-muted/10 text-foreground-muted"
            }`}
          >
            {learnedCount > 0
              ? `Bắt đầu ôn tập (${effectiveCount} từ) →`
              : "Chưa có từ nào đã học"}
          </button>
        </div>
      </div>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-sm text-foreground-muted transition-colors hover:text-indigo-light"
        >
          ← Quay lại thư mục
        </button>
      </div>
    </div>
  );
}
