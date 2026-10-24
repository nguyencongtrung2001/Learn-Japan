"use client";

import { useState } from "react";
import { QuestionPanel } from "./question-panel";
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
        // Fallback kiểm tra nội bộ nếu API gặp lỗi
        const fallback = checkSentenceLocally(
          value.trim(),
          card.word,
          card.example
        );
        setCheckResult(fallback);
      }
    } catch {
      // Fallback khi offline
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

  return (
    <QuestionPanel feedback={feedback} className="p-6 sm:p-10">
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
        <strong className="text-foreground font-bold">&quot;{card.word}&quot;</strong>.
      </p>

      {/* Form nhập câu */}
      <form onSubmit={handleCheck} className="space-y-4">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={checkResult !== null}
          rows={3}
          autoComplete="off"
          spellCheck={false}
          placeholder="VD: Through hard work and perseverance, he achieved his goal."
          className={`w-full resize-none rounded-2xl border-2 bg-surface/50 p-4 text-base sm:text-lg font-medium text-foreground outline-none transition-all placeholder:text-foreground-muted/30 focus:border-indigo focus:ring-4 focus:ring-indigo/10 ${
            checkResult?.score === "perfect" || checkResult?.score === "good"
              ? "border-emerald/50 bg-emerald/5"
              : checkResult?.score === "needs_improvement"
              ? "border-amber-500/50 bg-amber-500/5"
              : checkResult?.score === "invalid"
              ? "border-rose/50 bg-rose/5"
              : "border-border/60"
          }`}
        />

        {/* Nút Kiểm tra (khi chưa kiểm tra) */}
        {!checkResult && (
          <button
            type="submit"
            disabled={!value.trim() || isChecking}
            className="w-full cursor-pointer rounded-2xl bg-indigo py-3.5 text-base font-bold text-white transition-all hover:bg-indigo-light hover:shadow-lg hover:shadow-indigo/20 disabled:opacity-50 disabled:hover:shadow-none"
          >
            {isChecking ? "⏳ Đang phân tích câu..." : "🔍 Kiểm tra câu & Gợi ý sửa lỗi"}
          </button>
        )}
      </form>

      {/* ─── KẾT QUẢ PHÂN TÍCH & GỢI Ý SỬA LỖI ───────────────── */}
      {checkResult && (
        <div className="mt-6 space-y-4 text-left animate-fade-in">
          {/* Banner điểm & Trạng thái */}
          <div
            className={`rounded-2xl p-4 border flex items-start gap-3 ${
              checkResult.score === "perfect"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : checkResult.score === "good"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : checkResult.score === "needs_improvement"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <span className="text-2xl shrink-0">
              {checkResult.score === "perfect"
                ? "🌟"
                : checkResult.score === "good"
                ? "✅"
                : checkResult.score === "needs_improvement"
                ? "⚠️"
                : "❌"}
            </span>
            <div>
              <h4 className="font-bold text-sm sm:text-base">
                {checkResult.score === "perfect"
                  ? "Xuất sắc! Câu dùng từ chính xác và ngữ pháp chuẩn."
                  : checkResult.score === "good"
                  ? "Rất tốt! Câu đạt yêu cầu (xem một số gợi ý nhỏ bên dưới)."
                  : checkResult.score === "needs_improvement"
                  ? "Cần cải thiện: Câu đã dùng từ khóa nhưng có lỗi ngữ pháp hoặc chính tả."
                  : "Chưa đạt: Câu chưa sử dụng từ khóa hoặc chưa đủ cấu trúc."}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {checkResult.hasKeyword
                  ? `✓ Đã nhận diện từ khóa: "${checkResult.matchedKeyword || card.word}"`
                  : `✗ Chưa tìm thấy từ khóa "${card.word}" trong câu.`}
              </p>
            </div>
          </div>

          {/* Danh sách lỗi & Gợi ý sửa */}
          {checkResult.suggestions.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-surface/70 p-4 space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
                <span>💡</span> Chi tiết góp ý & Gợi ý sửa lỗi:
              </h5>
              <ul className="space-y-2">
                {checkResult.suggestions.map((sug, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-foreground-muted rounded-xl bg-background/60 p-2.5 border border-border/50"
                  >
                    <span className="shrink-0 mt-0.5">
                      {sug.type === "grammar"
                        ? "🔴"
                        : sug.type === "spelling"
                        ? "🟡"
                        : sug.type === "missing_keyword"
                        ? "⛔"
                        : "🔵"}
                    </span>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{sug.message}</p>
                      {sug.original && sug.replacement && (
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="line-through text-rose font-mono">
                            {sug.original}
                          </span>
                          <span>➔</span>
                          <span className="font-bold text-emerald font-mono">
                            {sug.replacement}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Câu gợi ý sửa hoàn chỉnh */}
          {checkResult.correctedSentence && (
            <div className="rounded-2xl border border-indigo/30 bg-indigo/10 p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-indigo-light flex items-center gap-1.5">
                  <span>✨</span> Câu gợi ý sửa hoàn chỉnh:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyCorrection(checkResult.correctedSentence!)
                  }
                  className="text-[11px] font-semibold text-indigo-light hover:underline cursor-pointer"
                >
                  Áp dụng câu này
                </button>
              </div>
              <p className="text-sm font-semibold text-foreground font-mono bg-background/80 p-2.5 rounded-xl border border-indigo/20">
                &quot;{checkResult.correctedSentence}&quot;
              </p>
            </div>
          )}

          {/* Câu mẫu tham khảo từ thẻ */}
          {card.example && (
            <div className="rounded-2xl border border-border/70 bg-surface/50 p-4">
              <span className="text-xs font-bold text-foreground-dim block mb-1">
                📖 Câu mẫu tham khảo từ thẻ:
              </span>
              <p className="text-xs sm:text-sm italic text-foreground-muted">
                &quot;{card.example}&quot;
              </p>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 rounded-2xl border border-border py-3 text-sm font-bold text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all cursor-pointer"
            >
              ✏️ Viết lại câu
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-all shadow-md cursor-pointer ${
                checkResult.isValid
                  ? "bg-gradient-to-r from-emerald-500 to-indigo hover:opacity-95"
                  : "bg-gradient-to-r from-rose to-indigo hover:opacity-95"
              }`}
            >
              Tiếp tục ➔
            </button>
          </div>
        </div>
      )}
    </QuestionPanel>
  );
}
