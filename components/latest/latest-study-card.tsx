"use client";

import Link from "next/link";
import type { LatestFolderItem } from "@/actions/latest-actions";

interface LatestStudyCardProps {
  folder: LatestFolderItem;
}

export function LatestStudyCard({ folder }: LatestStudyCardProps) {
  const isJapanese = folder.language === "japanese";
  const hasCards = folder.cardCount > 0;
  const percentLearned = hasCards
    ? Math.round((folder.learnedCount / folder.cardCount) * 100)
    : 0;

  return (
    <div className="glass-card group relative flex flex-col justify-between rounded-2xl border border-border/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo/60 hover:shadow-xl hover:shadow-indigo/10">
      {/* ══════ THÔNG TIN ĐẦU THẺ (QUIZLET HEADER) ══════ */}
      <div>
        <div className="flex items-center justify-between gap-2 text-xs font-bold mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-surface text-foreground-dim uppercase tracking-wider text-[11px] font-mono border border-border/60">
              {folder.cardCount} thuật ngữ
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                isJapanese
                  ? "bg-sakura/10 text-sakura-light border-sakura/25"
                  : "bg-indigo/10 text-indigo-light border-indigo/25"
              }`}
            >
              {isJapanese ? "🇯🇵 Tiếng Nhật" : "🇬🇧 Tiếng Anh"}
            </span>
          </div>

          {folder.dueCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold animate-pulse">
              <span>💧</span> {folder.dueCount} cần ôn
            </span>
          )}
        </div>

        {/* Tiêu đề học phần */}
        <Link
          href={`/folders/${folder.id}`}
          className="block group-hover:text-indigo-light transition-colors"
        >
          <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground line-clamp-1 mb-1">
            {folder.name}
          </h3>
          {folder.description && (
            <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed mb-3">
              {folder.description}
            </p>
          )}
        </Link>

        {/* ══════ HỘP XEM TRƯỚC TỪ VỰNG (QUIZLET PREVIEW) ══════ */}
        <div className="my-3 p-2.5 rounded-xl bg-surface/60 border border-border/50 text-xs space-y-1.5 min-h-[4.5rem]">
          {folder.previewCards && folder.previewCards.length > 0 ? (
            folder.previewCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between gap-2 text-foreground-muted"
              >
                <div className="flex items-center gap-1 font-semibold text-foreground truncate">
                  <span className="text-indigo-light">•</span>
                  <span className="truncate">{card.word}</span>
                  {card.kanji && (
                    <span className="text-sakura-light font-jp text-[11px]">
                      ({card.kanji})
                    </span>
                  )}
                </div>
                <span className="text-foreground-dim text-[11px] truncate shrink-0 max-w-[50%]">
                  {card.translation}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-foreground-dim text-xs italic py-2">
              Chưa có từ vựng nào. Hãy thêm từ ngay!
            </div>
          )}
        </div>
      </div>

      {/* ══════ TIẾN ĐỘ & TÁC GIẢ & HÀNH ĐỘNG ══════ */}
      <div className="mt-2 space-y-3 pt-3 border-t border-border/50">
        {/* Thanh tiến độ */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-foreground-dim font-medium mb-1">
            <span>Tiến độ ghi nhớ</span>
            <span className="font-mono text-emerald font-bold">
              {percentLearned}% ({folder.learnedCount}/{folder.cardCount})
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden border border-border/40">
            <div
              className="h-full bg-gradient-to-r from-emerald to-teal-400 transition-all duration-300"
              style={{ width: `${percentLearned}%` }}
            />
          </div>
        </div>

        {/* Thông tin tác giả & Các chế độ học Quizlet */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Avatar & Author */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo to-sakura flex items-center justify-center text-white text-[11px] font-black shadow-sm">
              B
            </div>
            <span className="text-[11px] text-foreground-dim font-medium">
              Bạn
            </span>
          </div>

          {/* Quick study buttons */}
          <div className="flex items-center gap-1.5">
            <Link
              href={`/folders/${folder.id}`}
              className="px-2.5 py-1 rounded-lg bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover text-xs font-semibold border border-border/60 transition-colors flex items-center gap-1"
              title="Mở Thẻ ghi nhớ Flashcard"
            >
              <span>🗂️</span> Thẻ
            </Link>

            <Link
              href={`/folders/${folder.id}/quiz`}
              className="px-2.5 py-1 rounded-lg bg-emerald/15 text-emerald-light hover:bg-emerald/25 text-xs font-bold border border-emerald/30 transition-all flex items-center gap-1"
              title="Bắt đầu học từ vựng mới"
            >
              <span>🌱</span> Học
            </Link>

            <Link
              href={`/folders/${folder.id}/quiz?mode=review`}
              className="px-2.5 py-1 rounded-lg bg-indigo/15 text-indigo-light hover:bg-indigo/25 text-xs font-bold border border-indigo/30 transition-all flex items-center gap-1"
              title="Kiểm tra & Ôn tập phản xạ"
            >
              <span>✍️</span> Kiểm tra
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
