"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LatestDashboardData } from "@/actions/latest-actions";
import { importRecommendedSet } from "@/actions/latest-actions";
import { LatestStudyCard } from "./latest-study-card";
import { CreateSetModal } from "./create-set-modal";

interface LatestDashboardProps {
  initialData: LatestDashboardData;
}

type FilterTab = "all" | "japanese" | "english" | "due" | "mastered";
type SortOption = "recent" | "cards-desc" | "learned-desc" | "name-asc";

export function LatestDashboard({ initialData }: LatestDashboardProps) {
  const router = useRouter();
  const [data] = useState(initialData);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { folders, stats, recommendedSets } = data;

  // Filter & Search folders
  const filteredFolders = useMemo(() => {
    let result = [...folders];

    // Filter by tab
    if (activeTab === "japanese") {
      result = result.filter((f) => f.language === "japanese");
    } else if (activeTab === "english") {
      result = result.filter((f) => f.language === "english");
    } else if (activeTab === "due") {
      result = result.filter((f) => f.dueCount > 0);
    } else if (activeTab === "mastered") {
      result = result.filter(
        (f) => f.cardCount > 0 && f.learnedCount >= f.cardCount
      );
    }

    // Filter by search query (name, description, or preview words)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((f) => {
        const matchName = f.name.toLowerCase().includes(q);
        const matchDesc = f.description?.toLowerCase().includes(q) || false;
        const matchPreview = f.previewCards.some(
          (c) =>
            c.word.toLowerCase().includes(q) ||
            c.translation.toLowerCase().includes(q) ||
            (c.kanji && c.kanji.toLowerCase().includes(q))
        );
        return matchName || matchDesc || matchPreview;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === "cards-desc") {
        return b.cardCount - a.cardCount;
      }
      if (sortOption === "learned-desc") {
        const rateA = a.cardCount > 0 ? a.learnedCount / a.cardCount : 0;
        const rateB = b.cardCount > 0 ? b.learnedCount / b.cardCount : 0;
        return rateB - rateA;
      }
      if (sortOption === "name-asc") {
        return a.name.localeCompare(b.name, "vi");
      }
      // "recent"
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [folders, activeTab, searchQuery, sortOption]);

  // Handle 1-click import of recommended sets
  const handleImportRecommended = (key: string) => {
    setImportingKey(key);
    startTransition(async () => {
      const res = await importRecommendedSet(key);
      setImportingKey(null);
      if (res.success && res.folderId) {
        router.push(`/folders/${res.folderId}`);
        router.refresh();
      } else {
        alert(res.error || "Lỗi khi nhập bộ thẻ gợi ý!");
      }
    });
  };

  const dueSetsCount = useMemo(
    () => folders.filter((f) => f.dueCount > 0).length,
    [folders]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* ══════════ BỐ CỤC 2 CỘT CHUẨN QUIZLET ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ══════════ CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG QUIZLET ══════════ */}
        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-20">
          {/* User Profile Card */}
          <div className="glass-card p-5 rounded-3xl border border-border/80 shadow-lg space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo via-sakura to-emerald flex items-center justify-center text-white text-lg font-black shadow-md shadow-indigo/25">
                  B
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald border-2 border-background flex items-center justify-center text-[9px] text-white">
                  ✓
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">
                  Học viên chăm chỉ
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-foreground-muted mt-0.5">
                  <span className="text-amber-400 font-bold">🔥 3 ngày</span>
                  <span>chuỗi học</span>
                </div>
              </div>
            </div>

            {/* Quick Create Action Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-shine w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo to-sakura text-white font-bold text-sm shadow-xl shadow-indigo/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
            >
              <span className="text-base">➕</span> Tạo học phần mới
            </button>
          </div>

          {/* Navigation Links (Quizlet Style) */}
          <div className="glass-card p-3 rounded-3xl border border-border/80 shadow-md space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-foreground-dim uppercase tracking-wider">
              Thư viện của bạn
            </div>

            <Link
              href="/latest"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm bg-indigo/15 text-indigo-light border border-indigo/25 transition-all"
            >
              <span className="text-base">⚡</span>
              <span>Gần đây (Latest)</span>
            </Link>

            <Link
              href="/folders"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-foreground-muted hover:text-foreground hover:bg-surface transition-all"
            >
              <span className="text-base">📂</span>
              <span>Tất cả học phần</span>
              <span className="ml-auto text-xs font-mono text-foreground-dim">
                {stats.totalSets}
              </span>
            </Link>

            <Link
              href="/alphabet"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-foreground-muted hover:text-foreground hover:bg-surface transition-all"
            >
              <span className="text-base">🇯🇵</span>
              <span>Bảng chữ cái (Kana)</span>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-sakura/20 text-sakura-light font-bold">
                208
              </span>
            </Link>

            <Link
              href="/tracker"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-foreground-muted hover:text-foreground hover:bg-surface transition-all"
            >
              <span className="text-base">📅</span>
              <span>Lịch ôn tập SRS</span>
              {stats.totalDue > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold animate-pulse">
                  {stats.totalDue}
                </span>
              )}
            </Link>

            <Link
              href="/note"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-foreground-muted hover:text-foreground hover:bg-surface transition-all"
            >
              <span className="text-base">📋</span>
              <span>Bảng ghi chú</span>
            </Link>
          </div>

          {/* Spaced Repetition Info Pill */}
          <div className="p-4 rounded-2xl bg-surface/60 border border-border/60 text-xs text-foreground-muted leading-relaxed space-y-1.5 hidden lg:block">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span>💡</span> Ghi nhớ ngắt quãng (SRS)
            </div>
            <p className="text-[11px] text-foreground-dim">
              Các từ vựng bạn ôn đúng hạn sẽ kéo dài thời gian nhớ và tự động nhắc nhở khi sắp quên.
            </p>
          </div>
        </aside>

        {/* ══════════ CỘT PHẢI: KHU VỰC FEED CHÍNH ══════════ */}
        <main className="lg:col-span-9 space-y-7">
          {/* ══════ BANNER ĐỘNG LỰC & CHUỖI NGÀY HỌC (QUIZLET HEADER) ══════ */}
          <div className="glass-card relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-border/80 shadow-xl space-y-4">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-indigo via-sakura to-emerald" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo/15 text-indigo-light border border-indigo/25 mb-2">
                  <span>🚀</span>
                  <span>Hoạt động gần đây • Quizlet Feed</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Chào mừng bạn trở lại! 👋
                </h1>
                <p className="text-xs sm:text-sm text-foreground-muted mt-1">
                  Tiếp tục rèn luyện trí nhớ và nâng cao phản xạ từ vựng ngay hôm nay.
                </p>
              </div>

              {/* Chỉ số nhanh */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
                <div className="bg-surface/80 px-3.5 py-2.5 rounded-2xl border border-border/70 text-center min-w-[70px]">
                  <div className="text-xs text-foreground-dim font-medium">Học phần</div>
                  <div className="text-lg font-black text-foreground font-mono">
                    {stats.totalSets}
                  </div>
                </div>

                <div className="bg-surface/80 px-3.5 py-2.5 rounded-2xl border border-border/70 text-center min-w-[70px]">
                  <div className="text-xs text-foreground-dim font-medium">Thuật ngữ</div>
                  <div className="text-lg font-black text-indigo-light font-mono">
                    {stats.totalCards}
                  </div>
                </div>

                <div className="bg-surface/80 px-3.5 py-2.5 rounded-2xl border border-border/70 text-center min-w-[70px]">
                  <div className="text-xs text-foreground-dim font-medium">Đã thuộc</div>
                  <div className="text-lg font-black text-emerald font-mono">
                    {stats.totalLearned}
                  </div>
                </div>

                <div className="bg-surface/80 px-3.5 py-2.5 rounded-2xl border border-border/70 text-center min-w-[70px]">
                  <div className="text-xs text-foreground-dim font-medium">Cần ôn</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {stats.totalDue}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════ SECTION GẦN ĐÂY (CORE OF /LATEST) ══════ */}
          <div className="space-y-4">
            {/* Header & Bộ lọc Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Gần đây
                </h2>
                <span className="text-xs text-foreground-dim font-mono">
                  ({filteredFolders.length})
                </span>
              </div>

              {/* Sắp xếp dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-foreground-dim font-medium">Sắp xếp:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="px-3 py-1.5 rounded-xl bg-surface border border-border/80 text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo/40 cursor-pointer"
                >
                  <option value="recent">Gần đây nhất</option>
                  <option value="cards-desc">Nhiều thẻ nhất</option>
                  <option value="learned-desc">Tỉ lệ thuộc cao nhất</option>
                  <option value="name-asc">Tên (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Thanh công cụ: Tabs & Ô Tìm kiếm tức thì */}
            <div className="glass-card p-3 sm:p-4 rounded-2xl border border-border/80 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === "all"
                      ? "bg-indigo text-white shadow-sm"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  Tất cả ({stats.totalSets})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("japanese")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === "japanese"
                      ? "bg-sakura text-white shadow-sm"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  🇯🇵 Tiếng Nhật ({stats.japaneseSetsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("english")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === "english"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  🇬🇧 Tiếng Anh ({stats.englishSetsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("due")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === "due"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  💧 Cần ôn ({dueSetsCount})
                </button>
              </div>

              {/* Ô tìm kiếm nhanh */}
              <div className="relative min-w-[220px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập để lọc học phần hoặc từ..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border/70 bg-surface/80 text-foreground placeholder:text-foreground-dim text-xs focus:outline-none focus:ring-2 focus:ring-indigo/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-dim hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Grid các học phần phong cách Quizlet */}
            {filteredFolders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredFolders.map((folder) => (
                  <LatestStudyCard key={folder.id} folder={folder} />
                ))}
              </div>
            ) : (
              <div className="glass-card p-10 rounded-3xl border border-border/80 text-center space-y-3">
                <div className="text-4xl">📂</div>
                <h3 className="text-base font-bold text-foreground">
                  Không tìm thấy học phần nào
                </h3>
                <p className="text-xs sm:text-sm text-foreground-muted max-w-sm mx-auto">
                  {searchQuery
                    ? `Không có kết quả nào khớp với "${searchQuery}". Hãy thử từ khóa khác!`
                    : "Bạn chưa có học phần nào trong nhóm này. Hãy tạo một học phần mới hoặc khám phá các bộ gợi ý dưới đây!"}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo text-white font-bold text-xs hover:bg-indigo-dark transition-all cursor-pointer shadow-md"
                >
                  <span>➕</span> Tạo học phần đầu tiên
                </button>
              </div>
            )}
          </div>

          {/* ══════ SECTION GỢI Ý HỌC PHẦN (RECOMMENDED SETS / DISCOVER) ══════ */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <span>💡</span> Được đề xuất cho bạn
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Bộ thẻ được chuẩn hóa sẵn với từ vựng, phiên âm và ví dụ thực tế.
                </p>
              </div>

              <Link
                href="/alphabet"
                className="text-xs font-bold text-sakura-light hover:underline flex items-center gap-1"
              >
                <span>🇯🇵 Bảng chữ cái</span> →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recommendedSets.map((rec) => (
                <div
                  key={rec.key}
                  className="glass-card group relative flex flex-col justify-between rounded-2xl border border-border/80 p-5 transition-all duration-300 hover:border-sakura/50 hover:shadow-xl space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-surface text-foreground-dim uppercase tracking-wider text-[11px] font-mono border border-border/60">
                        {rec.termsCount} thuật ngữ
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-sakura/10 text-sakura-light border border-sakura/25 text-[11px] font-semibold">
                        {rec.badge}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{rec.icon}</span>
                        <h3 className="text-base font-bold text-foreground group-hover:text-sakura-light transition-colors line-clamp-1">
                          {rec.title}
                        </h3>
                      </div>
                      <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                        {rec.description}
                      </p>
                    </div>

                    {/* Preview terms */}
                    <div className="p-2.5 rounded-xl bg-surface/60 border border-border/50 text-xs space-y-1">
                      {rec.previewTerms.map((term, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] text-foreground-muted"
                        >
                          <span className="font-semibold text-foreground truncate">
                            • {term.term}
                          </span>
                          <span className="text-foreground-dim truncate max-w-[50%]">
                            {term.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Import Button */}
                  <button
                    type="button"
                    disabled={isPending && importingKey === rec.key}
                    onClick={() => handleImportRecommended(rec.key)}
                    className="btn-shine w-full py-2.5 px-3 rounded-xl bg-surface hover:bg-surface-hover text-foreground font-bold text-xs border border-border hover:border-sakura/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>📥</span>
                    {isPending && importingKey === rec.key
                      ? "Đang nhập bộ thẻ..."
                      : "Thêm vào thư viện của tôi"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Modal tạo học phần mới */}
      <CreateSetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
