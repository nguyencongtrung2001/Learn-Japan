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
      <h1 className="mb-2 text-center text-3xl font-bold text-[#1A1D28]">Chọn Chế Độ</h1>
      <p className="mb-10 text-center text-sm text-[#586380]">Học từ mới hoặc ôn tập từ đã học</p>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Card 1: Học từ mới */}
        <div
          className={`flex flex-col justify-between rounded-2xl border border-[#E2E4E9] bg-white p-6 shadow-xs transition-all ${
            newCount > 0
              ? "hover:border-[#23B26D]/50 hover:shadow-md"
              : "opacity-50"
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-4xl">🌱</span>
              {newCount > 0 ? (
                <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-[#23B26D]">
                  {newCount} từ mới
                </span>
              ) : (
                <span className="rounded-lg bg-[#EDEFF4] px-2.5 py-0.5 text-xs text-[#586380]">
                  Đã hết từ mới
                </span>
              )}
            </div>
            <h3 className="mb-1 text-lg font-bold text-[#1A1D28]">Học từ mới</h3>
            <p className="text-xs sm:text-sm text-[#586380] mb-4">
              {newCount > 0
                ? `Gieo hạt ${newCount} từ vựng mới theo từng lô 5 từ (từ mức 🌰 đến 🌺).`
                : "Tất cả từ đã được học! Thêm thẻ mới hoặc chọn ôn tập."}
            </p>
          </div>

          <button
            type="button"
            onClick={onStartLearn}
            disabled={newCount === 0}
            className={`w-full cursor-pointer rounded-xl py-2.5 px-4 text-center text-xs sm:text-sm font-bold transition-all ${
              newCount > 0
                ? "bg-[#23B26D] text-white shadow-xs hover:bg-[#1fa362] active:scale-98"
                : "cursor-not-allowed bg-[#EDEFF4] text-[#939BB4]"
            }`}
          >
            {newCount > 0 ? "Bắt đầu học (5 từ) →" : "Đã học hết"}
          </button>
        </div>

        {/* Card 2: Ôn tập & Luyện tập tự do */}
        <div
          className={`flex flex-col justify-between rounded-2xl border border-[#E2E4E9] bg-white p-6 shadow-xs transition-all ${
            isReviewFocused ? "border-[#4255FF] shadow-md ring-2 ring-[#4255FF]/10" : ""
          } ${
            learnedCount > 0
              ? "hover:border-[#4255FF]/50 hover:shadow-md"
              : "opacity-50"
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-4xl">{dueCount > 0 ? "💧" : "⚡"}</span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {dueCount > 0 && (
                  <span className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-600">
                    💧 {dueCount} đến hạn
                  </span>
                )}
                {learnedCount > 0 && (
                  <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-[#4255FF]">
                    📚 {learnedCount} đã học
                  </span>
                )}
              </div>
            </div>

            <h3 className="mb-1 text-lg font-bold text-[#1A1D28]">
              {dueCount > 0 ? "Ôn tập đến hạn & Tự do" : "⚡ Ôn tập tự do / Cấp tốc"}
            </h3>
            <p className="text-xs sm:text-sm text-[#586380] mb-4">
              {dueCount > 0
                ? `Tưới nước ${dueCount} hoa đến hạn và chủ động củng cố thêm từ vựng.`
                : "Luyện tập tự do củng cố trí nhớ trước giờ kiểm tra ngay cả khi chưa đến hạn."}
            </p>

            {/* Bộ chọn số lượng từ ôn tập */}
            {learnedCount > 0 && (
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#586380]">
                  <span>Số lượng từ ôn tập:</span>
                  <span className="text-[#4255FF] font-bold">
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
                            ? "bg-[#4255FF] text-white shadow-xs"
                            : isUnavailable
                            ? "cursor-not-allowed bg-[#F6F7FB] text-[#939BB4] line-through"
                            : "bg-[#EDEFF4] text-[#586380] hover:bg-[#E2E4E9] hover:text-[#1A1D28]"
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
            <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-[#23B26D] border border-emerald-200">
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
            className={`w-full cursor-pointer rounded-xl py-2.5 px-4 text-center text-xs sm:text-sm font-bold transition-all ${
              learnedCount > 0
                ? "bg-[#4255FF] text-white shadow-xs hover:bg-[#3344DD] active:scale-98"
                : "cursor-not-allowed bg-[#EDEFF4] text-[#939BB4]"
            }`}
          >
            {learnedCount > 0
              ? `Bắt đầu ôn tập (${effectiveCount} từ) →`
              : "Chưa có từ nào đã học"}
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-xs sm:text-sm font-semibold text-[#586380] transition-colors hover:text-[#1A1D28]"
        >
          ← Quay lại thư mục
        </button>
      </div>
    </div>
  );
}
