import { LimitProgress } from "./limit-progress";
import type { Folder } from "@/db/schema";

interface FolderInfoCardProps {
  folder: Folder;
  total: number;
  newCount: number;
  dueCount: number;
  editing: boolean;
}

export function FolderInfoCard({ folder, total, newCount, dueCount, editing }: FolderInfoCardProps) {
  return (
    <div className="glass-card relative overflow-hidden p-5">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-sakura to-indigo opacity-60" />
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-indigo/5" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-3xl">📂</span>
          <h1 className="min-w-0 break-words text-2xl font-extrabold tracking-tight">
            <span className="gradient-text">{folder.name}</span>
          </h1>
        </div>

        {folder.description && !editing && (
          <p className="mb-4 text-sm leading-relaxed text-foreground-muted">{folder.description}</p>
        )}

        {folder.maxCards && !editing && <LimitProgress current={total} max={folder.maxCards} />}

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border/50 bg-surface px-3 py-1 text-xs font-medium text-foreground-dim shadow-sm">
            📚 {total} thẻ
          </span>
          <span className="rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald shadow-sm">
            🌱 {newCount} chưa học
          </span>
          <span className="rounded-full border border-sakura/20 bg-sakura/10 px-3 py-1 text-xs font-bold text-sakura-light shadow-sm">
            💧 {dueCount} cần ôn
          </span>
        </div>
      </div>
    </div>
  );
}
