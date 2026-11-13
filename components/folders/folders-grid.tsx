"use client";

import { useMemo, useState } from "react";
import { FolderCard } from "./folder-card";
import type { FolderWithCount } from "@/actions/folder-actions";
import { getFolderStatus, type FolderStatus } from "@/lib/folder-status";

type FilterTab = "all" | FolderStatus;

export function FoldersGrid({ folders }: { folders: FolderWithCount[] }) {
  const [filter, setFilter] = useState<FilterTab>("all");

  const counts = useMemo(() => {
    let completed = 0;
    let learning = 0;
    let notStarted = 0;

    for (const f of folders) {
      const st = getFolderStatus(f.cardCount ?? 0, f.learnedCount ?? 0, f.studyingCount ?? 0).status;
      if (st === "completed") completed++;
      else if (st === "learning") learning++;
      else if (st === "not_started") notStarted++;
    }

    return { all: folders.length, completed, learning, not_started: notStarted };
  }, [folders]);

  const filteredFolders = useMemo(() => {
    if (filter === "all") return folders;
    return folders.filter((f) => {
      const st = getFolderStatus(f.cardCount ?? 0, f.learnedCount ?? 0, f.studyingCount ?? 0).status;
      return st === filter;
    });
  }, [folders, filter]);

  if (folders.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#E2E4E9] bg-white py-16 text-center shadow-xs">
        <div className="mb-3 text-4xl">📁</div>
        <p className="font-bold text-[#1A1D28]">Chưa có thư mục nào</p>
        <p className="mt-1 text-xs text-[#586380]">Bấm nút &quot;Tạo Thư Mục Mới&quot; để bắt đầu!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bộ lọc trạng thái thư mục */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E4E9] pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-[#1A1D28] text-white shadow-xs"
              : "bg-white hover:bg-[#EDEFF4] text-[#586380] hover:text-[#1A1D28] border border-[#E2E4E9]"
          }`}
        >
          Tất cả ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setFilter("learning")}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "learning"
              ? "bg-[#4255FF] text-white shadow-xs"
              : "bg-white hover:bg-blue-50 text-[#4255FF] border border-blue-200"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#4255FF]" />
          <span>Đang học ({counts.learning})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "completed"
              ? "bg-[#23B26D] text-white shadow-xs"
              : "bg-white hover:bg-emerald-50 text-[#23B26D] border border-emerald-200"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#23B26D]" />
          <span>Đã hoàn thành ({counts.completed})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("not_started")}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "not_started"
              ? "bg-[#FFCD1F] text-[#1A1D28] shadow-xs"
              : "bg-white hover:bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFCD1F]" />
          <span>Chưa học ({counts.not_started})</span>
        </button>
      </div>

      {filteredFolders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#E2E4E9] bg-white py-12 text-center">
          <p className="text-sm font-semibold text-[#586380]">
            Không có thư mục nào ở trạng thái này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
}
