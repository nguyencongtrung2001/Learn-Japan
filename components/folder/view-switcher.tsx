"use client";

export type FolderViewMode = "classic" | "minimal" | "split";

interface ViewSwitcherProps {
  currentMode: FolderViewMode;
  onChangeMode: (mode: FolderViewMode) => void;
  cardsCount: number;
}

export function ViewSwitcher({
  currentMode,
  onChangeMode,
  cardsCount,
}: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center p-1 rounded-xl bg-white border border-[#E2E4E9] shadow-xs">
      <button
        type="button"
        onClick={() => onChangeMode("classic")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          currentMode === "classic"
            ? "bg-[#1A1D28] text-white shadow-xs"
            : "text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
        }`}
        title="Giao diện 1: Quản lý thư mục, thêm/sửa/xóa thẻ & danh sách dạng lưới"
      >
        <span>📋</span>
        <span>Quản lý</span>
      </button>

      <button
        type="button"
        disabled={cardsCount === 0}
        onClick={() => onChangeMode("minimal")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          currentMode === "minimal"
            ? "bg-[#4255FF] text-white shadow-xs"
            : "text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
        }`}
        title="Giao diện 2: Flashcard Tối giản & Tập trung (Quizlet Clean UI)"
      >
        <span>📁</span>
        <span>Flashcard</span>
      </button>

      <button
        type="button"
        disabled={cardsCount === 0}
        onClick={() => onChangeMode("split")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hidden sm:flex ${
          currentMode === "split"
            ? "bg-[#4255FF] text-white shadow-xs"
            : "text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
        }`}
        title="Giao diện 2 Mở rộng: Chia đôi màn hình 3:7 (Danh sách cuộn đồng bộ + Thẻ)"
      >
        <span>📄</span>
        <span>Split-View</span>
      </button>
    </div>
  );
}
