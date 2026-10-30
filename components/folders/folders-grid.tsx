import { FolderCard } from "./folder-card";
import type { FolderWithCount } from "@/actions/folder-actions";

export function FoldersGrid({ folders }: { folders: FolderWithCount[] }) {
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} />
      ))}
    </div>
  );
}
