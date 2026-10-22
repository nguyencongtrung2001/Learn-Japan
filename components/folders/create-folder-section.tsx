"use client";

import { useState } from "react";
import { createFolder } from "@/actions/folder-actions";

const inputClass =
  "w-full rounded-2xl border-2 border-border/50 bg-surface/50 px-5 py-4 font-medium text-foreground outline-none transition-all placeholder:text-foreground-muted/40 focus:border-indigo focus:ring-4 focus:ring-indigo/10";
const labelClass = "mb-2 block text-sm font-semibold uppercase tracking-wide text-foreground-muted";

/**
 * Nút + form tạo thư mục. Form không controlled (FormData) nên không render lại khi gõ.
 * createFolder đã gọi revalidatePath("/folders") → danh sách (Server Component) tự cập nhật.
 */
export function CreateFolderSection() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const limitRaw = String(fd.get("limit") ?? "").trim();
    if (!name) return;

    setSubmitting(true);
    try {
      const res = await createFolder({
        name,
        description: description || undefined,
        maxCards: limitRaw ? parseInt(limitRaw, 10) : undefined,
      });
      if (res.success) {
        setOpen(false);
      } else {
        alert(res.error || "Lỗi khi tạo thư mục!");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối khi tạo thư mục!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-10 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-full px-8 py-4 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sakura to-indigo transition-transform duration-300 group-hover:scale-110" />
          <span className="relative z-10">{open ? "✕ Đóng" : "＋ Tạo Thư Mục Mới"}</span>
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="glass-card animate-fade-in relative mx-auto mb-12 max-w-lg space-y-6 overflow-hidden p-8 shadow-2xl sm:p-10"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-sakura to-indigo opacity-50" />
          <h3 className="mb-2 text-center text-2xl font-bold">Thêm Thư Mục</h3>

          <div>
            <label className={labelClass} htmlFor="folder-name">
              Tên thư mục <span className="text-rose">*</span>
            </label>
            <input
              id="folder-name"
              name="name"
              type="text"
              required
              autoComplete="off"
              placeholder="VD: Từ vựng N5 Bài 1"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="folder-desc">
              Mô tả (tùy chọn)
            </label>
            <textarea
              id="folder-desc"
              name="description"
              rows={2}
              placeholder="VD: Từ vựng chủ đề gia đình, giao tiếp cơ bản..."
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="folder-max">
              Giới hạn số từ (tùy chọn)
            </label>
            <input id="folder-max" name="limit" type="number" min="1" placeholder="VD: 50" className={inputClass} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-sakura to-indigo py-4 text-lg font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sakura/30 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {submitting ? "⏳ Đang tạo..." : "✅ Lưu Thư Mục"}
          </button>
        </form>
      )}
    </>
  );
}
