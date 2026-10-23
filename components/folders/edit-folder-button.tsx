"use client";

import { useState, useTransition } from "react";
import { updateFolder } from "@/actions/folder-actions";
import type { Folder } from "@/db/schema";

const inputClass =
  "w-full rounded-xl border-2 border-border/50 bg-surface/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-foreground-muted/40 focus:border-indigo focus:ring-4 focus:ring-indigo/10";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground-muted";

export function EditFolderButton({ folder }: { folder: Folder }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description ?? "");
  const [limit, setLimit] = useState(folder.maxCards ? String(folder.maxCards) : "");
  const [pending, startTransition] = useTransition();

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setName(folder.name);
    setDescription(folder.description ?? "");
    setLimit(folder.maxCards ? String(folder.maxCards) : "");
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Tên thư mục không được để trống!");
      return;
    }

    startTransition(async () => {
      try {
        const parsed = limit ? parseInt(limit, 10) : undefined;
        await updateFolder(folder.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          maxCards: parsed && parsed > 0 ? parsed : undefined,
        });
        setOpen(false);
      } catch (error) {
        console.error("Lỗi cập nhật thư mục:", error);
        alert("Không thể cập nhật thư mục. Vui lòng thử lại.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="cursor-pointer rounded-xl border border-indigo/20 bg-indigo/5 px-3 py-2 text-sm text-indigo-light shadow-sm transition-all duration-300 hover:border-indigo hover:bg-indigo hover:text-white"
        title="Chỉnh sửa thư mục"
        aria-label="Chỉnh sửa thư mục"
      >
        ✏️
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div
            className="glass-card relative w-full max-w-md overflow-hidden p-6 shadow-2xl animate-scale-bounce sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-indigo to-sakura opacity-70" />

            <div className="mb-6 flex items-center justify-between">
              <h3 className="gradient-text text-xl font-extrabold flex items-center gap-2">
                <span>📁</span> Chỉnh Sửa Thư Mục
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor={`edit-folder-name-${folder.id}`}>
                  Tên thư mục <span className="text-rose">*</span>
                </label>
                <input
                  id={`edit-folder-name-${folder.id}`}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên thư mục..."
                  className={`${inputClass} text-base font-bold`}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor={`edit-folder-desc-${folder.id}`}>
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  id={`edit-folder-desc-${folder.id}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả nội dung thư mục..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor={`edit-folder-limit-${folder.id}`}>
                  Giới hạn số từ
                </label>
                <input
                  id={`edit-folder-limit-${folder.id}`}
                  type="number"
                  min="1"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="VD: 50 (để trống nếu không giới hạn)"
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-sakura to-indigo py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo/30 active:scale-[0.98] disabled:opacity-50"
                >
                  {pending ? "⏳ Đang lưu..." : "💾 Lưu Thay Đổi"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-xl border border-border/50 bg-surface px-5 py-3 text-sm font-bold text-foreground-muted transition-all duration-300 hover:border-rose/20 hover:bg-rose/10 hover:text-rose"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
