"use client";

interface FolderLanguageTabsProps {
  activeLanguage: "japanese" | "english";
  onSelectLanguage: (lang: "japanese" | "english") => void;
  japaneseCount: number;
  englishCount: number;
}

export function FolderLanguageTabs({
  activeLanguage,
  onSelectLanguage,
  japaneseCount,
  englishCount,
}: FolderLanguageTabsProps) {
  return (
    <div className="mx-auto mb-8 max-w-lg">
      <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white border border-[#E2E4E9] shadow-xs gap-1.5">
        {/* Tab Tiếng Nhật */}
        <button
          type="button"
          onClick={() => onSelectLanguage("japanese")}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${
            activeLanguage === "japanese"
              ? "bg-[#4255FF] text-white shadow-md shadow-[#4255FF]/20 scale-[1.01]"
              : "text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
          }`}
          aria-label="Xem bộ thẻ tiếng Nhật"
          aria-selected={activeLanguage === "japanese"}
          role="tab"
        >
          <span className="text-xl">🇯🇵</span>
          <span>Tiếng Nhật</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
              activeLanguage === "japanese"
                ? "bg-white/20 text-white"
                : "bg-[#EDEFF4] text-[#586380]"
            }`}
          >
            {japaneseCount}
          </span>
        </button>

        {/* Tab Tiếng Anh */}
        <button
          type="button"
          onClick={() => onSelectLanguage("english")}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${
            activeLanguage === "english"
              ? "bg-[#4255FF] text-white shadow-md shadow-[#4255FF]/20 scale-[1.01]"
              : "text-[#586380] hover:text-[#1A1D28] hover:bg-[#EDEFF4]"
          }`}
          aria-label="Xem bộ thẻ tiếng Anh"
          aria-selected={activeLanguage === "english"}
          role="tab"
        >
          <span className="text-xl">🇬🇧</span>
          <span>Tiếng Anh</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
              activeLanguage === "english"
                ? "bg-white/20 text-white"
                : "bg-[#EDEFF4] text-[#586380]"
            }`}
          >
            {englishCount}
          </span>
        </button>
      </div>
    </div>
  );
}
