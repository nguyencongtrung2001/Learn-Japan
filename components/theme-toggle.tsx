"use client";

import { useTheme } from "./theme-provider";
import { useLanguage } from "./language-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-[#E2E4E9] bg-white text-[#1A1D28] hover:bg-[#EDEFF4] transition-all cursor-pointer shadow-xs active:scale-95"
      aria-label={t("theme", "toggle")}
      title={isDark ? t("theme", "light") : t("theme", "dark")}
    >
      <span className="text-base transition-transform duration-300 transform">
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
