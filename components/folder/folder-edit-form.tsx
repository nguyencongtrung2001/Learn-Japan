"use client";

import { useState } from "react";
import type { Folder } from "@/db/schema";

interface FolderEditFormProps {
  folder: Folder;
  total: number;
  onSave: (data: { name: string; description?: string; maxCards?: number }) => Promise<boolean>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-xl border-2 border-border/50 bg-surface/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-foreground-muted/40 focus:border-indigo focus:ring-4 focus:ring-indigo/10";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground-muted";

/** State của form nằm trong chính component này → gõ phím không làm render lại cả trang. */
export function FolderEditForm({ folder, total, onSave, onCancel }: FolderEditFormProps) {
  const [name, setName] = useState(folder.name ?? "");
  const [description, setDescription] = useState(folder.description ?? "");
  const [limit, setLimit] = useState(folder.maxCards ? String(folder.maxCards) : "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Tên thư mục không được để trống!");
      return;
    }
    setSaving(true);
    const parsed = limit ? parseInt(limit, 10) : undefined;
    const ok = await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      maxCards: parsed && parsed > 0 ? parsed : undefined,
    });
    setSaving(false);
    if (!ok) alert("Cập nhật thất bại");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card animate-fade-in relative space-y-4 overflow-hidden p-5 shadow-xl"
    >
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-indigo to-sakura opacity-60" />
      <h3 className="gradient-text flex items-center gap-2 text-base font-extrabold">⚙️ Chỉnh sửa Thư Mục</h3>

      <div>
        <label className={labelClass} htmlFor="folder-name">
          Tên thư mục <span className="text-rose">*</span>
        </label>
        <input
          id="folder-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên thư mục..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="folder-description">
          Mô tả (tùy chọn)
        </label>
        <textarea
          id="folder-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả nội dung thư mục..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="folder-limit">
          Giới hạn số từ
        </label>
        <input
          id="folder-limit"
          type="number"
          min="1"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="VD: 50 (trống = ∞)"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-foreground-dim">
          💡 Giới hạn: {total}/{limit ? limit : "∞"} (hiện có {total} từ)
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-emerald to-teal-500 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald/30 active:translate-y-0 disabled:opacity-50"
        >
          {saving ? "⏳ Đang lưu..." : "✅ Lưu"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-xl border border-border/50 bg-surface px-4 py-2.5 text-sm font-bold text-foreground-muted transition-all duration-300 hover:border-rose/20 hover:bg-rose/10 hover:text-rose"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
