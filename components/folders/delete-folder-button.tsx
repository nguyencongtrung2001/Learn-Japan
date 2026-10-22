"use client";

import { useTransition } from "react";
import { deleteFolder } from "@/actions/folder-actions";

export function DeleteFolderButton({ folderId }: { folderId: number }) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm("Bạn có chắc muốn xóa thư mục này? Tất cả thẻ trong đó sẽ bị xóa.")) return;
    startTransition(async () => {
      try {
        await deleteFolder(folderId); // revalidatePath("/folders") trong action sẽ làm mới danh sách
      } catch (error) {
        console.error(error);
        alert("Không thể xóa thư mục. Vui lòng thử lại.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="cursor-pointer rounded-xl border border-rose/10 bg-rose/5 px-4 py-2.5 text-sm text-rose/70 shadow-sm transition-all duration-300 hover:bg-rose hover:text-white disabled:opacity-50"
      title="Xóa thư mục"
      aria-label="Xóa thư mục"
    >
      {pending ? "⏳" : "🗑️"}
    </button>
  );
}
