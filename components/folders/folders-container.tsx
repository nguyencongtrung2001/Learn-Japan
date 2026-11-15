"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FolderWithCount } from "@/actions/folder-actions";
import { FoldersHeader } from "./folders-header";
import { FolderLanguageTabs } from "./folder-language-tabs";
import { CreateFolderSection } from "./create-folder-section";
import { FoldersGrid } from "./folders-grid";

const STORAGE_KEY = "active_folder_language";

export function FoldersContainer({
  initialFolders,
}: {
  initialFolders: FolderWithCount[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Validate URL param
  const urlLang = searchParams.get("lang");
  const validUrlLang = urlLang === "english" || urlLang === "japanese" ? urlLang : null;

  // Lazy initializer for local state from localStorage
  const [selectedLanguage, setSelectedLanguage] = useState<"japanese" | "english">(() => {
    if (typeof window === "undefined") return "japanese";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "japanese" || saved === "english") return saved;
    } catch {
      // ignore
    }
    return "japanese";
  });

  // Effective language: URL query param has priority, otherwise local state
  const activeLanguage = validUrlLang ?? selectedLanguage;

  // Handle switching language tab
  const handleSelectLanguage = (lang: "japanese" | "english") => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }

    // Update URL query param smoothly without scrolling
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("lang", lang);
      router.replace(`/folders?${params.toString()}`, { scroll: false });
    });
  };

  // Partition folders by language
  const { japaneseFolders, englishFolders } = useMemo(() => {
    const jp: FolderWithCount[] = [];
    const en: FolderWithCount[] = [];

    for (const folder of initialFolders) {
      if (folder.language === "english") {
        en.push(folder);
      } else {
        // Default to japanese
        jp.push(folder);
      }
    }

    return { japaneseFolders: jp, englishFolders: en };
  }, [initialFolders]);

  const currentFolders = activeLanguage === "japanese" ? japaneseFolders : englishFolders;

  return (
    <div className="space-y-6">
      <FoldersHeader />

      {/* Bộ chuyển đổi phân tách rõ ràng Tiếng Nhật vs Tiếng Anh */}
      <FolderLanguageTabs
        activeLanguage={activeLanguage}
        onSelectLanguage={handleSelectLanguage}
        japaneseCount={japaneseFolders.length}
        englishCount={englishFolders.length}
      />

      {/* Khu vực tạo thư mục mới (đồng bộ ngôn ngữ theo tab đang mở) */}
      <CreateFolderSection defaultLanguage={activeLanguage} />

      {/* Lưới hiển thị danh sách 3 cột độc lập theo ngôn ngữ */}
      <FoldersGrid folders={currentFolders} language={activeLanguage} />
    </div>
  );
}
