"use client";

import { useEffect, useState } from "react";
import type { CardListItem, CardInput } from "@/lib/card-utils";

interface EditCardModalProps {
  card: CardListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: CardInput) => Promise<boolean>;
}

const inputClass =
  "w-full rounded-xl border-2 border-border/50 bg-surface/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-foreground-muted/40 focus:border-indigo focus:ring-4 focus:ring-indigo/10";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground-muted";

export function EditCardModal({ card, isOpen, onClose, onSave }: EditCardModalProps) {
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card) {
      setWord(card.word);
      setTranslation(card.translation);
      setPhonetic(card.phonetic ?? "");
      setDefinition(card.definition ?? "");
      setExample(card.example ?? "");
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) {
      alert("Từ vựng và Nghĩa tiếng Việt không được để trống!");
      return;
    }

    setSaving(true);
    const ok = await onSave(card.id, {
      word: word.trim(),
      translation: translation.trim(),
      phonetic: phonetic.trim() || undefined,
      definition: definition.trim() || undefined,
      example: example.trim() || undefined,
    });
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card relative w-full max-w-lg overflow-hidden p-6 shadow-2xl animate-scale-bounce sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-indigo to-sakura opacity-70" />
        
        <div className="mb-6 flex items-center justify-between">
          <h3 className="gradient-text text-xl font-extrabold flex items-center gap-2">
            <span>✏️</span> Chỉnh Sửa Thẻ Từ Vựng
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="edit-word">
              Từ vựng <span className="text-rose">*</span>
            </label>
            <input
              id="edit-word"
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="VD: Resilience / Accomplish"
              className={`${inputClass} text-lg font-bold`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="edit-translation">
                Nghĩa tiếng Việt <span className="text-rose">*</span>
              </label>
              <input
                id="edit-translation"
                type="text"
                required
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Sự kiên cường / Hoàn thành"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-phonetic">
                Phiên âm IPA
              </label>
              <input
                id="edit-phonetic"
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/rɪˈzɪl.jəns/"
                className={`${inputClass} text-indigo-light`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-definition">
              Định nghĩa / Giải thích thêm
            </label>
            <textarea
              id="edit-definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Giải thích ngữ nghĩa, cách dùng..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-example">
              Ví dụ câu
            </label>
            <textarea
              id="edit-example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Câu ví dụ thực tế..."
              rows={2}
              className={`${inputClass} resize-none italic`}
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-sakura to-indigo py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo/30 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "⏳ Đang lưu..." : "💾 Lưu Thay Đổi"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-border/50 bg-surface px-5 py-3 text-sm font-bold text-foreground-muted transition-all duration-300 hover:border-rose/20 hover:bg-rose/10 hover:text-rose"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
