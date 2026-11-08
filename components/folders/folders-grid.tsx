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
      <div className="glass-card mx-auto max-w-md py-20 text-center">
        <div className="mb-4 text-5xl">📁</div>
        <p className="text-foreground-muted">Chưa có thư mục nào</p>
        <p className="mt-1 text-sm text-foreground-dim">Bấm nút &quot;Tạo thư mục mới&quot; để bắt đầu!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bộ lọc trạng thái thư mục */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
            filter === "all"
              ? "bg-foreground text-background shadow-sm"
              : "bg-surface hover:bg-surface-hover text-foreground-muted hover:text-foreground border border-border/60"
          }`}
        >
          Tất cả ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setFilter("learning")}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
            filter === "learning"
              ? "bg-indigo text-white shadow-indigo/25 shadow-md"
              : "bg-indigo/10 hover:bg-indigo/20 text-indigo-light border border-indigo/20"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <span>Đang học ({counts.learning})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
            filter === "completed"
              ? "bg-emerald text-white shadow-emerald/25 shadow-md"
              : "bg-emerald/10 hover:bg-emerald/20 text-emerald border border-emerald/20"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
          <span>Đã hoàn thành ({counts.completed})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("not_started")}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
            filter === "not_started"
              ? "bg-amber-500 text-white shadow-amber-500/25 shadow-md"
              : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>Chưa học ({counts.not_started})</span>
        </button>
      </div>

      {filteredFolders.length === 0 ? (
        <div className="glass-card py-12 text-center border-dashed border-2 border-border/50">
          <p className="text-sm font-semibold text-foreground-muted">
            Không có thư mục nào ở trạng thái này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
}
