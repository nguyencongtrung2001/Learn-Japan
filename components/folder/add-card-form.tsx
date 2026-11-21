"use client";

import { useRef, useState } from "react";
import type { CardInput } from "@/lib/card-utils";
import { ImageUploader } from "./image-uploader";

interface AddCardFormProps {
  /** Trả về true nếu tạo thành công (form sẽ được reset). */
  onSubmit: (input: CardInput) => Promise<boolean>;
  /** Callback đóng form khi bấm icon X hoặc nút Hủy */
  onClose?: () => void;
  folderLanguage?: string;
}

const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#586380]";
const baseInput =
  "w-full rounded-xl border border-[#E2E4E9] bg-white px-3.5 text-[#1A1D28] outline-none transition-all placeholder:text-[#939BB4] focus:border-[#4255FF] focus:ring-2 focus:ring-[#4255FF]/10 text-sm";

export function AddCardForm({ onSubmit, onClose, folderLanguage = "japanese" }: AddCardFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

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
      furigana: get("furigana") || undefined,
      romaji: get("romaji") || undefined,
      translation,
      partOfSpeech: get("partOfSpeech") || undefined,
      phonetic: get("phonetic") || undefined,
      imageUrl: imageUrl || undefined,
      definition: get("definition") || undefined,
      example: get("example") || undefined,
      exampleMeaning: get("exampleMeaning") || undefined,
    });
    setSubmitting(false);
    if (ok) {
      formRef.current?.reset();
      setImageUrl("");
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="animate-fade-in relative mb-6 rounded-2xl border border-[#E2E4E9] bg-white p-5 sm:p-7 shadow-lg"
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28] transition-all cursor-pointer z-10"
          title="Đóng form"
          aria-label="Đóng form thêm thẻ"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="border-b border-[#E2E4E9] pb-3 mb-5">
        <h3 className="text-lg font-bold text-[#1A1D28] flex items-center gap-2">
          <span>{isJapanese ? "🇯🇵" : "🇬🇧"}</span>
          <span>{isJapanese ? "Thêm Thẻ Tiếng Nhật Mới" : "Thêm Thẻ Từ Vựng Mới"}</span>
        </h3>
        <p className="text-xs text-[#586380] mt-0.5">
          {isJapanese
            ? "Cấu trúc chuẩn: Từ vựng (Kana) | Kanji | Furigana | Romaji | Loại từ | Nghĩa | Ngữ cảnh | Ví dụ (có dịch) | Hình ảnh"
            : "Nhập đầy đủ thông tin để flashcard hiển thị trực quan"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 1. Từ vựng (Kana) */}
        <div>
          <label className={labelClass} htmlFor="card-word">
            {isJapanese ? "1. Từ vựng / Kana (Hiragana/Katakana)" : "Từ vựng"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            id="card-word"
            name="word"
            type="text"
            required
            autoComplete="off"
            placeholder={isJapanese ? "VD: さくら / たべる" : "VD: apple"}
            className={`${baseInput} py-2.5 text-base font-bold placeholder:font-normal`}
          />
        </div>

        {/* 2. Chữ Hán (Kanji) */}
        {isJapanese ? (
          <div>
            <label className={labelClass} htmlFor="card-kanji">
              2. 🈁 Chữ Hán (Kanji)
            </label>
            <input
              id="card-kanji"
              name="kanji"
              type="text"
              autoComplete="off"
              placeholder="VD: 桜 hoặc 食べる"
              className={`${baseInput} py-2.5 text-base font-bold placeholder:font-normal text-red-600 font-jp`}
            />
          </div>
        ) : (
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
              className={`${baseInput} py-2.5 font-medium text-[#4255FF]`}
            />
          </div>
        )}

        {/* 3 & 4: Furigana & Romaji (nếu là tiếng Nhật) */}
        {isJapanese && (
          <>
            <div>
              <label className={labelClass} htmlFor="card-furigana">
                3. Furigana (Cách đọc Hán tự)
              </label>
              <input
                id="card-furigana"
                name="furigana"
                type="text"
                autoComplete="off"
                placeholder="VD: さくら / たべる"
                className={`${baseInput} py-2.5 font-medium text-sakura-light`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="card-romaji">
                4. Romaji
              </label>
              <input
                id="card-romaji"
                name="romaji"
                type="text"
                autoComplete="off"
                placeholder="VD: sakura / taberu"
                className={`${baseInput} py-2.5 font-medium text-[#4255FF] font-mono`}
              />
            </div>
          </>
        )}

        {/* 5. Loại từ */}
        <div>
          <label className={labelClass} htmlFor="card-pos">
            5. Loại từ (Part of Speech)
          </label>
          <input
            id="card-pos"
            name="partOfSpeech"
            type="text"
            list="pos-suggestions"
            placeholder={isJapanese ? "VD: Danh từ, Động từ N1..." : "VD: NOUN, VERB, ADJ..."}
            className={`${baseInput} py-2.5 font-medium`}
          />
          <datalist id="pos-suggestions">
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
            <option value="NOUN" />
            <option value="VERB" />
            <option value="ADJ" />
            <option value="ADV" />
          </datalist>
        </div>

        {/* 6. Nghĩa tiếng Việt */}
        <div>
          <label className={labelClass} htmlFor="card-translation">
            6. Nghĩa tiếng Việt <span className="text-red-500">*</span>
          </label>
          <input
            id="card-translation"
            name="translation"
            type="text"
            required
            autoComplete="off"
            placeholder={isJapanese ? "VD: Hoa anh đào" : "VD: Quả táo"}
            className={`${baseInput} py-2.5 font-medium`}
          />
        </div>

        {/* 7. Hình ảnh minh họa */}
        <div className="md:col-span-2">
          <label className={labelClass}>
            7. Hình ảnh minh họa
          </label>
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            language={folderLanguage}
          />
        </div>

        {/* 8. Ngữ cảnh sử dụng & Sắc thái */}
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="card-definition">
            8. 💡 {isJapanese ? "Ngữ cảnh sử dụng & Sắc thái" : "Định nghĩa / Ngữ cảnh sử dụng"} (tùy chọn)
          </label>
          <textarea
            id="card-definition"
            name="definition"
            rows={2}
            placeholder={
              isJapanese
                ? "VD: Biểu tượng mùa xuân nước Nhật, vẻ đẹp rực rỡ nhưng ngắn ngủi thanh khiết..."
                : "VD: A round fruit with red or green skin and firm white flesh..."
            }
            className={`${baseInput} resize-none py-2.5`}
          />
        </div>

        {/* 9. Câu ví dụ thực tế */}
        <div className={isJapanese ? "md:col-span-1" : "md:col-span-2"}>
          <label className={labelClass} htmlFor="card-example">
            9. 💬 {isJapanese ? "Câu ví dụ thực tế" : "Ví dụ thực tế"} (tùy chọn)
          </label>
          <textarea
            id="card-example"
            name="example"
            rows={2}
            placeholder={
              isJapanese
                ? "VD: 春になると桜が綺麗に咲きます。"
                : "VD: I ate a sweet red apple for breakfast."
            }
            className={`${baseInput} resize-none py-2.5`}
          />
        </div>

        {/* 10. Dịch nghĩa câu ví dụ (có dịch nghĩa) */}
        {isJapanese && (
          <div className="md:col-span-1">
            <label className={labelClass} htmlFor="card-example-meaning">
              10. 📝 Dịch nghĩa câu ví dụ (tùy chọn)
            </label>
            <textarea
              id="card-example-meaning"
              name="exampleMeaning"
              rows={2}
              placeholder="VD: Khi mùa xuân đến, hoa anh đào nở rất đẹp."
              className={`${baseInput} resize-none py-2.5`}
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border border-[#E2E4E9] bg-white py-3 text-sm font-bold text-[#586380] hover:bg-[#EDEFF4] transition-all"
          >
            ✕ Hủy bỏ
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`${
            onClose ? "flex-[2]" : "w-full"
          } cursor-pointer rounded-xl bg-[#4255FF] py-3 text-sm font-bold text-white transition-all hover:bg-[#3344DD] active:scale-98 disabled:opacity-50`}
        >
          {submitting ? "⏳ Đang lưu..." : "💾 Lưu Thẻ"}
        </button>
      </div>
    </form>
  );
}
