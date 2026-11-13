"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFolder } from "@/actions/folder-actions";

interface CreateSetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSetModal({ isOpen, onClose }: CreateSetModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<"japanese" | "english">("japanese");
  const [maxCards, setMaxCards] = useState<number | "">(100);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên học phần!");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await createFolder({
        name: name.trim(),
        description: description.trim() || undefined,
        language,
        maxCards: typeof maxCards === "number" ? maxCards : undefined,
      });

      if (res.success && res.data) {
        setName("");
        setDescription("");
        onClose();
        router.push(`/folders/${res.data.id}`);
        router.refresh();
      } else {
        setError(res.error || "Lỗi tạo học phần");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card relative w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-border shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Tạo học phần mới
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose/15 border border-rose/30 text-rose text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên học phần */}
          <div>
            <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-1.5">
              Tiêu đề học phần <span className="text-rose">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Từ vựng Minna no Nihongo Bài 1..."
              className="w-full px-4 py-2.5 rounded-xl border border-border/80 bg-surface/80 text-foreground placeholder:text-foreground-dim text-sm focus:outline-none focus:ring-2 focus:ring-indigo/40"
              autoFocus
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-1.5">
              Mô tả ngắn (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Các từ vựng về trường học, gia đình và nghề nghiệp..."
              className="w-full px-4 py-2.5 rounded-xl border border-border/80 bg-surface/80 text-foreground placeholder:text-foreground-dim text-sm focus:outline-none focus:ring-2 focus:ring-indigo/40 resize-none"
            />
          </div>

          {/* Chọn ngôn ngữ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-1.5">
                Ngôn ngữ
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage("japanese")}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    language === "japanese"
                      ? "border-sakura bg-sakura/15 text-sakura-light"
                      : "border-border/70 text-foreground-muted hover:bg-surface"
                  }`}
                >
                  <span>🇯🇵</span> Tiếng Nhật
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("english")}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    language === "english"
                      ? "border-indigo bg-indigo/15 text-indigo-light"
                      : "border-border/70 text-foreground-muted hover:bg-surface"
                  }`}
                >
                  <span>🇬🇧</span> Tiếng Anh
                </button>
              </div>
            </div>

            {/* Giới hạn thẻ */}
            <div>
              <label className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-1.5">
                Giới hạn từ vựng
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={maxCards}
                onChange={(e) =>
                  setMaxCards(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="100"
                className="w-full px-3 py-2 rounded-xl border border-border/80 bg-surface/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo/40"
              />
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-surface hover:text-foreground transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-shine px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo to-sakura text-white text-xs font-bold shadow-lg shadow-indigo/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Đang tạo..." : "Tạo & Mở học phần"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
