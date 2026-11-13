"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage, LANGUAGES } from "./language-provider";
import type { AppLanguage } from "@/lib/i18n";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: AppLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E2E4E9] bg-white text-xs font-bold text-[#1A1D28] hover:bg-[#EDEFF4] transition-all cursor-pointer shadow-xs"
        aria-label={t("lang", "select")}
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="hidden sm:inline font-semibold">{currentLang.nativeLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-[#586380] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-2xl border border-[#E2E4E9] bg-white p-1.5 shadow-xl animate-fade-in text-xs">
          <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#586380] border-b border-[#E2E4E9] mb-1">
            {t("lang", "select")}
          </div>

          <div className="space-y-0.5">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#4255FF]/10 text-[#4255FF] font-bold"
                      : "text-[#1A1D28] hover:bg-[#EDEFF4] font-medium"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {isSelected && (
                    <span className="text-[#4255FF] text-xs font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
