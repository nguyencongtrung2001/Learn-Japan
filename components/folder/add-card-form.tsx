"use client";

import { useRef, useState } from "react";
import type { CardInput } from "@/lib/card-utils";

interface AddCardFormProps {
  /** Trả về true nếu tạo thành công (form sẽ được reset). */
  onSubmit: (input: CardInput) => Promise<boolean>;
}

const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wide text-foreground-muted";
const baseInput =
  "w-full rounded-2xl border-2 border-border/50 bg-surface/50 px-5 text-foreground outline-none transition-all placeholder:text-foreground-muted/40 focus:border-indigo focus:ring-4 focus:ring-indigo/10";

/**
 * Form KHÔNG controlled (đọc bằng FormData khi submit) → gõ phím không gây re-render
 * và không động tới danh sách thẻ phía trên. Ô bắt buộc dùng thuộc tính `required` của HTML.
 */
export function AddCardForm({ onSubmit }: AddCardFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (key: string) => String(fd.get(key) ?? "").trim();

    const word = get("word");
    const translation = get("translation");
    if (!word || !translation) return;

    setSubmitting(true);
    const ok = await onSubmit({
      word,
      translation,
      partOfSpeech: get("partOfSpeech") || undefined,
      phonetic: get("phonetic") || undefined,
      definition: get("definition") || undefined,
      example: get("example") || undefined,
    });
    setSubmitting(false);
    if (ok) formRef.current?.reset();
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="glass-card animate-fade-in relative mb-6 overflow-hidden p-6 shadow-2xl sm:p-8"
    >
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-indigo to-sakura opacity-50" />
      <h3 className="gradient-text mb-6 text-center text-xl font-extrabold">Thêm Thẻ Từ Vựng</h3>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="card-word">
            Từ vựng <span className="text-rose">*</span>
          </label>
          <input
            id="card-word"
            name="word"
            type="text"
            required
            autoComplete="off"
            placeholder="VD: apple"
            className={`${baseInput} py-4 text-xl font-bold placeholder:font-normal`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="card-pos">
            Loại từ (Part of Speech)
          </label>
          <input
            id="card-pos"
            name="partOfSpeech"
            type="text"
            list="pos-suggestions"
            placeholder="VD: NOUN, VERB, ADJ, CỤM TỪ..."
            className={`${baseInput} py-3.5 font-medium uppercase`}
          />
          <datalist id="pos-suggestions">
            <option value="NOUN" />
            <option value="VERB" />
            <option value="ADJ" />
            <option value="ADV" />
            <option value="PHRASE" />
            <option value="CỤM TỪ" />
            <option value="STRUCTURE" />
            <option value="IDIOM" />
            <option value="PREPOSITION" />
          </datalist>
        </div>
        <div>
          <label className={labelClass} htmlFor="card-translation">
            Nghĩa tiếng Việt <span className="text-rose">*</span>
          </label>
          <input
            id="card-translation"
            name="translation"
            type="text"
            required
            autoComplete="off"
            placeholder="Quả táo"
            className={`${baseInput} py-3.5 font-medium`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="card-phonetic">
            Phiên âm IPA
          </label>
          <input
            id="card-phonetic"
            name="phonetic"
            type="text"
            autoComplete="off"
            placeholder="/ˈæp.əl/"
            className={`${baseInput} py-3.5 font-medium text-indigo-light`}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="card-definition">
            Định nghĩa tiếng Anh (tùy chọn)
          </label>
          <textarea
            id="card-definition"
            name="definition"
            rows={2}
            placeholder="A round fruit with red or green skin..."
            className={`${baseInput} resize-none py-3.5`}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="card-example">
            Ví dụ (tùy chọn)
          </label>
          <textarea
            id="card-example"
            name="example"
            rows={2}
            placeholder="I ate an apple."
            className={`${baseInput} resize-none py-3.5`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-sakura to-indigo py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo/30 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {submitting ? "⏳ Đang lưu..." : "💾 Lưu Thẻ"}
      </button>
    </form>
  );
}
