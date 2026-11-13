"use client";

import { useState } from "react";
import type { Folder } from "@/db/schema";

interface FolderEditFormProps {
  folder: Folder;
  total: number;
  onSave: (data: { name: string; description?: string; maxCards?: number; language?: string }) => Promise<boolean>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-xl border border-[#E2E4E9] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#1A1D28] outline-none transition-all placeholder:text-[#939BB4] focus:border-[#4255FF] focus:ring-2 focus:ring-[#4255FF]/10";
const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wider text-[#586380]";

export function FolderEditForm({ folder, total, onSave, onCancel }: FolderEditFormProps) {
  const [name, setName] = useState(folder.name ?? "");
  const [description, setDescription] = useState(folder.description ?? "");
  const [limit, setLimit] = useState(folder.maxCards ? String(folder.maxCards) : "");
  const [language, setLanguage] = useState<string>(folder.language || "japanese");
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
      language,
    });
    setSaving(false);
    if (!ok) alert("Cập nhật thất bại");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in relative space-y-3.5 rounded-2xl border border-[#E2E4E9] bg-white p-4 sm:p-5 shadow-xs"
    >
      <h3 className="text-sm font-bold text-[#1A1D28]">⚙️ Chỉnh sửa Thư Mục</h3>

      <div>
        <label className={labelClass}>Ngôn ngữ học tập</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLanguage("japanese")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-1.5 px-2 text-xs font-bold transition-all cursor-pointer ${
              language === "japanese"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-[#E2E4E9] bg-white text-[#586380] hover:bg-[#EDEFF4]"
            }`}
          >
            <span>🇯🇵</span> Tiếng Nhật
          </button>
          <button
            type="button"
            onClick={() => setLanguage("english")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-1.5 px-2 text-xs font-bold transition-all cursor-pointer ${
              language === "english"
                ? "border-[#4255FF] bg-blue-50 text-[#4255FF]"
                : "border-[#E2E4E9] bg-white text-[#586380] hover:bg-[#EDEFF4]"
            }`}
          >
            <span>🇬🇧</span> Tiếng Anh
          </button>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="folder-name">
          Tên thư mục <span className="text-red-500">*</span>
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
          rows={2}
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
        <p className="mt-1 text-[11px] text-[#939BB4]">
          Giới hạn: {total}/{limit ? limit : "∞"} từ
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 cursor-pointer rounded-xl bg-[#4255FF] py-2 text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#3344DD] active:scale-98 disabled:opacity-50"
        >
          {saving ? "⏳ Đang lưu..." : "✅ Lưu"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-xl border border-[#E2E4E9] bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-[#586380] hover:bg-[#EDEFF4]"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
