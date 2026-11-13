"use client";

import { useState } from "react";
import { createFolder } from "@/actions/folder-actions";

const inputClass =
  "w-full rounded-xl border border-[#E2E4E9] bg-white px-4 py-3 font-medium text-[#1A1D28] outline-none transition-all placeholder:text-[#939BB4] focus:border-[#4255FF] focus:ring-2 focus:ring-[#4255FF]/10 text-sm";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#586380]";

export function CreateFolderSection() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState<"japanese" | "english">("japanese");

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
        language,
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
      <div className="mb-8 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group relative inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#4255FF] px-7 py-3 text-sm font-bold text-white shadow-md shadow-[#4255FF]/20 transition-all duration-200 hover:bg-[#3344DD] hover:scale-105 active:scale-95"
        >
          <span>{open ? "✕ Đóng" : "＋ Tạo Thư Mục Mới"}</span>
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="animate-fade-in relative mx-auto mb-10 max-w-lg space-y-5 rounded-2xl border border-[#E2E4E9] bg-white p-6 sm:p-8 shadow-lg"
        >
          <div className="border-b border-[#E2E4E9] pb-3">
            <h3 className="text-xl font-bold text-[#1A1D28]">Thêm Thư Mục Mới</h3>
            <p className="text-xs text-[#586380] mt-0.5">Tạo không gian học tập cho chủ đề của bạn</p>
          </div>

          <div>
            <label className={labelClass}>Ngôn ngữ học tập</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage("japanese")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  language === "japanese"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-[#E2E4E9] bg-white text-[#586380] hover:bg-[#EDEFF4]"
                }`}
              >
                <span className="text-lg">🇯🇵</span> Tiếng Nhật
              </button>
              <button
                type="button"
                onClick={() => setLanguage("english")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  language === "english"
                    ? "border-[#4255FF] bg-blue-50 text-[#4255FF]"
                    : "border-[#E2E4E9] bg-white text-[#586380] hover:bg-[#EDEFF4]"
                }`}
              >
                <span className="text-lg">🇬🇧</span> Tiếng Anh
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="folder-name">
              Tên thư mục <span className="text-red-500">*</span>
            </label>
            <input
              id="folder-name"
              name="name"
              type="text"
              required
              autoComplete="off"
              placeholder={language === "japanese" ? "VD: Minna no Nihongo Bài 1 / N3 Kanji" : "VD: Oxford 3000 Words"}
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
              placeholder={
                language === "japanese"
                  ? "VD: Từ vựng giao tiếp, Kanji, ngữ cảnh & câu ví dụ..."
                  : "VD: Từ vựng chủ đề gia đình, giao tiếp cơ bản..."
              }
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
            className="w-full cursor-pointer rounded-xl bg-[#4255FF] py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#3344DD] active:scale-98 disabled:opacity-50"
          >
            {submitting ? "⏳ Đang tạo..." : "✅ Lưu Thư Mục"}
          </button>
        </form>
      )}
    </>
  );
}
