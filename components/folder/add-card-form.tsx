"use client";

import { useRef, useState } from "react";
import type { CardInput } from "@/lib/card-utils";

interface AddCardFormProps {
  /** Trả về true nếu tạo thành công (form sẽ được reset). */
  onSubmit: (input: CardInput) => Promise<boolean>;
  /** Callback đóng form khi bấm icon X hoặc nút Hủy */
  onClose?: () => void;
  folderLanguage?: string;
}

const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wide text-foreground-muted";
const baseInput =
  "w-full rounded-2xl border-2 border-border/50 bg-surface/50 px-5 text-foreground outline-none transition-all placeholder:text-foreground-muted/40 focus:border-indigo focus:ring-4 focus:ring-indigo/10";

/**
 * Form KHÔNG controlled (đọc bằng FormData khi submit) → gõ phím không gây re-render
 * và không động tới danh sách thẻ phía trên. Ô bắt buộc dùng thuộc tính `required` của HTML.
 */
export function AddCardForm({ onSubmit, onClose, folderLanguage = "japanese" }: AddCardFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrlPreview, setImageUrlPreview] = useState("");

  const isJapanese = folderLanguage === "japanese";

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
      kanji: get("kanji") || undefined,
      translation,
      partOfSpeech: get("partOfSpeech") || undefined,
      phonetic: get("phonetic") || undefined,
      imageUrl: get("imageUrl") || undefined,
      definition: get("definition") || undefined,
      example: get("example") || undefined,
    });
    setSubmitting(false);
    if (ok) {
      formRef.current?.reset();
      setImageUrlPreview("");
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="glass-card animate-fade-in relative mb-6 overflow-hidden p-6 shadow-2xl sm:p-8"
    >
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-indigo to-sakura opacity-50" />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl text-foreground-muted hover:bg-surface-hover hover:text-foreground hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer z-10"
          title="Đóng form"
          aria-label="Đóng form thêm thẻ"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <h3 className="gradient-text mb-6 text-center text-xl font-extrabold flex items-center justify-center gap-2">
        <span>{isJapanese ? "🇯🇵" : "🇬🇧"}</span>
        <span>{isJapanese ? "Thêm Thẻ Tiếng Nhật Mới" : "Thêm Thẻ Từ Vựng Mới"}</span>
      </h3>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 1. Từ vựng / Cụm từ */}
        <div className={isJapanese ? "md:col-span-1" : "md:col-span-2"}>
          <label className={labelClass} htmlFor="card-word">
            {isJapanese ? "Từ vựng / Kana (Hiragana/Katakana)" : "Từ vựng"}{" "}
            <span className="text-rose">*</span>
          </label>
          <input
            id="card-word"
            name="word"
            type="text"
            required
            autoComplete="off"
            placeholder={isJapanese ? "VD: さくら / たべる" : "VD: apple"}
            className={`${baseInput} py-4 text-xl font-bold placeholder:font-normal`}
          />
        </div>

        {/* Cột chữ Kanji nếu là tiếng Nhật */}
        {isJapanese && (
          <div className="md:col-span-1">
            <label className={labelClass} htmlFor="card-kanji">
              🈁 Chữ Hán (Kanji)
            </label>
            <input
              id="card-kanji"
              name="kanji"
              type="text"
              autoComplete="off"
              placeholder="VD: 桜 hoặc 食べる hoặc 一期一会"
              className={`${baseInput} py-4 text-xl font-bold placeholder:font-normal text-sakura-light`}
            />
          </div>
        )}

        {/* 2. Phiên âm / Romaji / Furigana */}
        <div>
          <label className={labelClass} htmlFor="card-phonetic">
            {isJapanese ? "Phiên âm / Furigana / Romaji" : "Phiên âm IPA"}
          </label>
          <input
            id="card-phonetic"
            name="phonetic"
            type="text"
            autoComplete="off"
            placeholder={isJapanese ? "VD: さくら / sakura" : "/ˈæp.əl/"}
            className={`${baseInput} py-3.5 font-medium text-indigo-light`}
          />
        </div>

        {/* 3. Nghĩa tiếng Việt */}
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
            placeholder={isJapanese ? "VD: Hoa anh đào" : "VD: Quả táo"}
            className={`${baseInput} py-3.5 font-medium`}
          />
        </div>

        {/* 4. Loại từ */}
        <div>
          <label className={labelClass} htmlFor="card-pos">
            Loại từ (Part of Speech)
          </label>
          <input
            id="card-pos"
            name="partOfSpeech"
            type="text"
            list="pos-suggestions"
            placeholder={isJapanese ? "VD: Danh từ (名詞), Động từ N1..." : "VD: NOUN, VERB, ADJ..."}
            className={`${baseInput} py-3.5 font-medium`}
          />
          <datalist id="pos-suggestions">
            {/* Tiếng Nhật */}
            <option value="Danh từ (名詞)" />
            <option value="Động từ nhóm 1 (五段動詞)" />
            <option value="Động từ nhóm 2 (一段動詞)" />
            <option value="Động từ nhóm 3 (サ変/カ変)" />
            <option value="Tính từ đuôi -i (い形容詞)" />
            <option value="Tính từ đuôi -na (な形容詞)" />
            <option value="Phó từ (副詞)" />
            <option value="Cụm từ (連語)" />
            <option value="Thành ngữ (慣用句)" />
            <option value="Trợ từ (助詞)" />
            <option value="Liên từ (接続詞)" />
            {/* Tiếng Anh */}
            <option value="NOUN" />
            <option value="VERB" />
            <option value="ADJ" />
            <option value="ADV" />
            <option value="PHRASE" />
            <option value="CỤM TỪ" />
            <option value="STRUCTURE" />
            <option value="IDIOM" />
          </datalist>
        </div>

        {/* 5. Hình ảnh nghĩa cốt lõi */}
        <div>
          <label className={labelClass} htmlFor="card-imageUrl">
            🖼️ Hình ảnh nghĩa cốt lõi (Link URL)
          </label>
          <input
            id="card-imageUrl"
            name="imageUrl"
            type="url"
            autoComplete="off"
            placeholder="https://images.unsplash.com/... (tùy chọn)"
            onChange={(e) => setImageUrlPreview(e.target.value.trim())}
            className={`${baseInput} py-3.5 text-xs font-mono`}
          />
        </div>

        {/* Image preview nếu người dùng dán URL ảnh */}
        {imageUrlPreview && (
          <div className="md:col-span-2 rounded-2xl border-2 border-indigo/30 bg-surface/30 p-3 flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrlPreview}
                alt="Xem trước hình ảnh nghĩa cốt lõi"
                className="h-full w-full object-cover"
                onError={() => {
                  /* Bỏ qua lỗi load ảnh */
                }}
              />
            </div>
            <div className="text-xs text-foreground-muted">
              <span className="font-bold text-foreground">🖼️ Xem trước hình ảnh nghĩa cốt lõi:</span>
              <p className="line-clamp-2 font-mono text-[11px] text-foreground-dim mt-0.5">{imageUrlPreview}</p>
            </div>
          </div>
        )}

        {/* 6. Ngữ cảnh sử dụng & Sắc thái */}
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="card-definition">
            💡 {isJapanese ? "Ngữ cảnh sử dụng & Sắc thái" : "Định nghĩa / Ngữ cảnh sử dụng"} (tùy chọn)
          </label>
          <textarea
            id="card-definition"
            name="definition"
            rows={2}
            placeholder={
              isJapanese
                ? "VD: Biểu tượng mùa xuân nước Nhật, dùng diễn tả vẻ đẹp rực rỡ nhưng mong manh, ngắn ngủi..."
                : "VD: A round fruit with red or green skin and firm white flesh..."
            }
            className={`${baseInput} resize-none py-3.5`}
          />
        </div>

        {/* 7. Câu ví dụ thực tế */}
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="card-example">
            💬 {isJapanese ? "Câu ví dụ thực tế (kèm dịch nghĩa)" : "Ví dụ thực tế"} (tùy chọn)
          </label>
          <textarea
            id="card-example"
            name="example"
            rows={2}
            placeholder={
              isJapanese
                ? "VD: 春になると桜がとても綺麗に咲きます。(Khi mùa xuân đến, hoa anh đào nở rất đẹp.)"
                : "VD: I ate a sweet red apple for breakfast."
            }
            className={`${baseInput} resize-none py-3.5`}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-2xl border border-border py-4 text-base font-bold text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all active:scale-[0.98]"
          >
            ✕ Hủy bỏ
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`${
            onClose ? "flex-[2]" : "w-full"
          } cursor-pointer rounded-2xl bg-gradient-to-r from-sakura to-indigo py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo/30 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none`}
        >
          {submitting ? "⏳ Đang lưu..." : "💾 Lưu Thẻ"}
        </button>
      </div>
    </form>
  );
}
