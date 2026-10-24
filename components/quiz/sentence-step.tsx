"use client";

import { useState } from "react";
import type { Card } from "@/db/schema";
import type { Feedback } from "@/lib/quiz";
import {
  checkSentenceLocally,
  type SentenceCheckResult,
} from "@/lib/sentence-checker";

interface SentenceStepProps {
  card: Card;
  feedback: Feedback;
  onSubmit: (value: string, isCorrect?: boolean) => void;
}

export function SentenceStep({ card, feedback, onSubmit }: SentenceStepProps) {
  const [value, setValue] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<SentenceCheckResult | null>(null);

  // Người dùng bấm nút Kiểm tra câu
  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isChecking) return;

    setIsChecking(true);
    try {
      // Gọi API phân tích câu (kết hợp NLP nội bộ + LanguageTool nếu có mạng)
      const res = await fetch("/api/check-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: value.trim(),
          targetWord: card.word,
          modelExample: card.example,
        }),
      });

      if (res.ok) {
        const result: SentenceCheckResult = await res.json();
        setCheckResult(result);
      } else {
        const fallback = checkSentenceLocally(
          value.trim(),
          card.word,
          card.example
        );
        setCheckResult(fallback);
      }
    } catch {
      const fallback = checkSentenceLocally(
        value.trim(),
        card.word,
        card.example
      );
      setCheckResult(fallback);
    } finally {
      setIsChecking(false);
    }
  };

  // Người dùng bấm Tiếp tục sau khi đã xem phân tích & gợi ý
  const handleProceed = () => {
    if (!checkResult) return;
    onSubmit(value.trim(), checkResult.isValid);
  };

  // Áp dụng câu đã được sửa tự động vào ô nhập
  const handleApplyCorrection = (corrected: string) => {
    setValue(corrected);
  };

  // Viết lại câu để thử lại
  const handleRetry = () => {
    setCheckResult(null);
  };

  // ─── GIAO DIỆN KHI ĐÃ CÓ KẾT QUẢ KIỂM TRA (SIDE-BY-SIDE 2 CỘT, KHÔNG CẦN SCROLL) ───
  if (checkResult) {
    return (
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch animate-fade-in">
        {/* CỘT TRÁI: Phần câu hỏi & Câu người dùng đã đặt */}
        <div className="glass-card flex flex-col justify-between p-5 sm:p-6 text-center border border-border/80 shadow-xl rounded-3xl">
          <div>
            <div className="mb-1 text-2xl sm:text-4xl font-extrabold tracking-tight">
              {card.word}
            </div>

            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
              {card.partOfSpeech && (
                <span className="rounded-md bg-indigo/15 border border-indigo/25 px-2 py-0.5 text-xs font-bold text-indigo-light uppercase tracking-wider">
                  {card.partOfSpeech}
                </span>
              )}
              <span className="text-xs sm:text-sm font-medium text-foreground-dim">
                ({card.translation})
              </span>
            </div>

            <p className="text-xs text-foreground-muted mb-2 text-left font-semibold">
              ✍️ Câu bạn đã đặt:
            </p>

            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border-2 border-border/70 bg-surface/70 p-3 text-sm font-medium text-foreground outline-none focus:border-indigo"
              placeholder="Nhập câu của bạn..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full rounded-xl border border-border/80 bg-surface/50 py-2.5 text-xs sm:text-sm font-bold text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all cursor-pointer"
            >
              ✏️ Sửa & Kiểm tra lại câu này
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: Chi tiết góp ý & Gợi ý sửa lỗi (NẰM NGAY BÊN CẠNH) */}
        <div className="glass-card flex flex-col justify-between p-5 sm:p-6 text-left border border-border/80 shadow-xl rounded-3xl">
          <div className="space-y-3">
            {/* Header: Tiêu đề & Huy hiệu trạng thái */}
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <span>💡</span> Chi tiết góp ý & Gợi ý sửa lỗi
              </h4>
              <span
                className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                  checkResult.score === "perfect"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : checkResult.score === "good"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                    : checkResult.score === "needs_improvement"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
              >
                {checkResult.score === "perfect" && "🌟 Xuất sắc"}
                {checkResult.score === "good" && "✅ Rất tốt"}
                {checkResult.score === "needs_improvement" && "⚠️ Cần cải thiện"}
                {checkResult.score === "invalid" && "❌ Chưa đạt"}
              </span>
            </div>

            {/* Thông điệp đánh giá ngắn gọn */}
            <p className="text-xs font-semibold text-foreground leading-snug">
              {checkResult.score === "perfect" &&
                "Xuất sắc! Câu dùng từ chính xác và ngữ pháp rất chuẩn."}
              {checkResult.score === "good" &&
                "Rất tốt! Câu đạt yêu cầu (xem thêm một số gợi ý nhỏ bên dưới)."}
              {checkResult.score === "needs_improvement" &&
                "Câu đã dùng từ khóa nhưng phát hiện một số lỗi ngữ pháp/chính tả:"}
              {checkResult.score === "invalid" &&
                "Câu chưa chứa từ khóa hoặc cấu trúc chưa đủ chủ ngữ/vị ngữ."}
            </p>

            {/* Danh sách lỗi và gợi ý (giới hạn chiều cao có scroll nội bộ để không bao giờ scroll trang) */}
            {checkResult.suggestions.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {checkResult.suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-background/70 p-2.5 border border-border/60 text-xs"
                  >
                    <p className="text-foreground-muted font-medium">
                      {sug.type === "grammar"
                        ? "🔴"
                        : sug.type === "spelling"
                        ? "🟡"
                        : sug.type === "missing_keyword"
                        ? "⛔"
                        : "🔵"}{" "}
                      {sug.message}
                    </p>
                    {sug.original && sug.replacement && (
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] pl-4">
                        <span className="line-through text-rose">
                          {sug.original}
                        </span>
                        <span>➔</span>
                        <span className="font-bold text-emerald-400">
                          {sug.replacement}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-400">
                ✓ Câu văn chuẩn xác, không phát hiện lỗi ngữ pháp nào!
              </div>
            )}

            {/* Câu gợi ý sửa hoàn chỉnh */}
            {checkResult.correctedSentence && (
              <div className="rounded-xl border border-indigo/30 bg-indigo/10 p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-light text-[11px]">
                    ✨ Câu gợi ý sửa hoàn chỉnh:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyCorrection(checkResult.correctedSentence!)
                    }
                    className="text-[10px] text-indigo-light hover:underline font-semibold cursor-pointer"
                  >
                    Áp dụng vào câu
                  </button>
                </div>
                <p className="font-mono text-foreground font-semibold leading-snug">
                  &quot;{checkResult.correctedSentence}&quot;
                </p>
              </div>
            )}

            {/* Câu mẫu tham khảo từ thẻ */}
            {card.example && (
              <div className="rounded-xl border border-border/60 bg-surface/40 p-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim block">
                  📖 Câu mẫu từ thẻ:
                </span>
                <p className="italic text-foreground-muted text-[11px] mt-0.5">
                  &quot;{card.example}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Nút Tiếp tục */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={handleProceed}
              className={`w-full rounded-xl py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer ${
                checkResult.isValid
                  ? "bg-gradient-to-r from-emerald-500 to-indigo hover:opacity-95"
                  : "bg-gradient-to-r from-rose to-indigo hover:opacity-95"
              }`}
            >
              Tiếp tục ➔
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── GIAO DIỆN TRƯỚC KHI BẤM KIỂM TRA (TẬP TRUNG GÕ CÂU) ───
  return (
    <div className="mx-auto max-w-xl glass-card p-6 sm:p-8 text-center border border-border/80 shadow-2xl rounded-3xl animate-fade-in">
      {/* Header từ vựng */}
      <div className="mb-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
        {card.word}
      </div>

      <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
        {card.partOfSpeech && (
          <span className="rounded-md bg-indigo/15 border border-indigo/25 px-2 py-0.5 text-xs font-bold text-indigo-light uppercase tracking-wider">
            {card.partOfSpeech}
          </span>
        )}
        <span className="text-sm sm:text-base font-medium text-foreground-dim">
          ({card.translation})
        </span>
      </div>

      <p className="mb-5 rounded-xl border border-border/60 bg-surface/50 p-3 text-xs sm:text-sm text-foreground-muted">
        ✍️ Hãy viết một câu tiếng Anh hoàn chỉnh có sử dụng từ{" "}
        <strong className="text-foreground font-bold">
          &quot;{card.word}&quot;
        </strong>
        .
      </p>

      {/* Form nhập câu */}
      <form onSubmit={handleCheck} className="space-y-4">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          autoComplete="off"
          spellCheck={false}
          placeholder="VD: Through hard work and perseverance, he achieved his goal."
          className="w-full resize-none rounded-2xl border-2 border-border/70 bg-surface/50 p-4 text-base sm:text-lg font-medium text-foreground outline-none transition-all placeholder:text-foreground-muted/30 focus:border-indigo focus:ring-4 focus:ring-indigo/10"
        />

        <button
          type="submit"
          disabled={!value.trim() || isChecking}
          className="w-full cursor-pointer rounded-2xl bg-indigo py-3.5 text-base font-bold text-white transition-all hover:bg-indigo-light hover:shadow-lg hover:shadow-indigo/20 disabled:opacity-50 disabled:hover:shadow-none"
        >
          {isChecking ? "⏳ Đang phân tích câu..." : "🔍 Kiểm tra câu & Gợi ý sửa lỗi"}
        </button>
      </form>
    </div>
  );
}
