"use client";

import { useState } from "react";
import type { CardListItem, CardInput } from "@/lib/card-utils";
import { ImageUploader } from "./image-uploader";

interface EditCardModalProps {
  card: CardListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: CardInput) => Promise<boolean>;
  folderLanguage?: string;
}

const inputClass =
  "w-full rounded-xl border border-[#E2E4E9] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#1A1D28] outline-none transition-all placeholder:text-[#939BB4] focus:border-[#4255FF] focus:ring-2 focus:ring-[#4255FF]/10";
const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wider text-[#586380]";

function EditCardFormContent({
  card,
  onClose,
  onSave,
  folderLanguage,
}: {
  card: CardListItem;
  onClose: () => void;
  onSave: (id: number, data: CardInput) => Promise<boolean>;
  folderLanguage: string;
}) {
  const [word, setWord] = useState(card.word);
  const [kanji, setKanji] = useState(card.kanji ?? "");
  const [furigana, setFurigana] = useState(card.furigana ?? "");
  const [romaji, setRomaji] = useState(card.romaji ?? "");
  const [translation, setTranslation] = useState(card.translation);
  const [partOfSpeech, setPartOfSpeech] = useState(card.partOfSpeech ?? "");
  const [phonetic, setPhonetic] = useState(card.phonetic ?? "");
  const [definition, setDefinition] = useState(card.definition ?? "");
  const [example, setExample] = useState(card.example ?? "");
  const [exampleMeaning, setExampleMeaning] = useState(card.exampleMeaning ?? "");
  const [imageUrl, setImageUrl] = useState(card.imageUrl ?? "");
  const [imageBusy, setImageBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const isJapanese = folderLanguage === "japanese";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageBusy) return;
    if (!word.trim() || !translation.trim()) {
      alert("Từ vựng và Nghĩa tiếng Việt không được để trống!");
      return;
    }

    setSaving(true);
    const ok = await onSave(card.id, {
      word: word.trim(),
      // Gửi "" (không phải undefined) để updateCard xóa thật giá trị đã bị người dùng bỏ trống.
      kanji: kanji.trim(),
      furigana: furigana.trim(),
      romaji: romaji.trim(),
      translation: translation.trim(),
      partOfSpeech: partOfSpeech.trim(),
      phonetic: phonetic.trim(),
      definition: definition.trim(),
      example: example.trim(),
      exampleMeaning: exampleMeaning.trim(),
      imageUrl: imageUrl.trim(),
    });
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E2E4E9] bg-white p-5 sm:p-7 shadow-2xl animate-scale-bounce"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-5 flex items-center justify-between border-b border-[#E2E4E9] pb-3">
        <h3 className="text-lg font-bold text-[#1A1D28] flex items-center gap-2">
          <span>✏️</span> {isJapanese ? "Chỉnh Sửa Thẻ Tiếng Nhật" : "Chỉnh Sửa Thẻ Từ Vựng"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28] transition-colors cursor-pointer"
          title="Đóng"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1 & 2: Từ vựng (Kana) & Chữ Hán (Kanji) */}
        <div className={isJapanese ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
          <div>
            <label className={labelClass} htmlFor="edit-word">
              {isJapanese ? "1. Từ vựng / Kana" : "Từ vựng"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-word"
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={isJapanese ? "VD: さくら / たべる" : "VD: apple"}
              className={`${inputClass} text-base font-bold`}
            />
          </div>

          {isJapanese && (
            <div>
              <label className={labelClass} htmlFor="edit-kanji">
                2. 🈁 Chữ Hán (Kanji)
              </label>
              <input
                id="edit-kanji"
                type="text"
                value={kanji}
                onChange={(e) => setKanji(e.target.value)}
                placeholder="VD: 桜 hoặc 食べる"
                className={`${inputClass} text-base font-bold text-red-600 font-jp`}
              />
            </div>
          )}
        </div>

        {/* 3 & 4: Furigana & Romaji (hoặc Phiên âm IPA) */}
        {isJapanese ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="edit-furigana">
                3. Furigana
              </label>
              <input
                id="edit-furigana"
                type="text"
                value={furigana}
                onChange={(e) => setFurigana(e.target.value)}
                placeholder="VD: さくら / たべる"
                className={`${inputClass} text-sakura-light`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-romaji">
                4. Romaji
              </label>
              <input
                id="edit-romaji"
                type="text"
                value={romaji}
                onChange={(e) => setRomaji(e.target.value)}
                placeholder="VD: sakura / taberu"
                className={`${inputClass} text-[#4255FF] font-mono`}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className={labelClass} htmlFor="edit-phonetic">
              Phiên âm IPA
            </label>
            <input
              id="edit-phonetic"
              type="text"
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
              placeholder="/ˈæp.əl/"
              className={`${inputClass} text-[#4255FF]`}
            />
          </div>
        )}

        {/* 5 & 6: Loại từ & Nghĩa tiếng Việt */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="edit-pos">
              {isJapanese ? "5. Loại từ" : "Loại từ"}
            </label>
            <input
              id="edit-pos"
              type="text"
              list="edit-pos-suggestions"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder={isJapanese ? "Danh từ, Động từ..." : "NOUN, VERB..."}
              className={inputClass}
            />
            <datalist id="edit-pos-suggestions">
              <option value="Danh từ (名詞)" />
              <option value="Động từ nhóm 1 (五段動詞)" />
              <option value="Động từ nhóm 2 (一段動詞)" />
              <option value="Động từ nhóm 3 (サ変/カ変)" />
              <option value="Tính từ đuôi -i (い形容詞)" />
              <option value="Tính từ đuôi -na (な形容詞)" />
              <option value="Phó từ (副詞)" />
              <option value="Cụm từ (連語)" />
              <option value="Thành ngữ (慣用句)" />
              <option value="NOUN" />
              <option value="VERB" />
              <option value="ADJ" />
              <option value="ADV" />
            </datalist>
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-translation">
              {isJapanese ? "6. Nghĩa tiếng Việt" : "Nghĩa tiếng Việt"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-translation"
              type="text"
              required
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder={isJapanese ? "Hoa anh đào" : "Quả táo"}
              className={inputClass}
            />
          </div>
        </div>

        {/* 7. Hình ảnh minh họa */}
        <ImageUploader
          value={imageUrl}
          onChange={setImageUrl}
          language={folderLanguage}
          onBusyChange={setImageBusy}
        />

        {/* 8. Ngữ cảnh sử dụng & Sắc thái */}
        <div>
          <label className={labelClass} htmlFor="edit-definition">
            💡 {isJapanese ? "8. Ngữ cảnh sử dụng & Sắc thái" : "Định nghĩa / Ngữ cảnh sử dụng"}
          </label>
          <textarea
            id="edit-definition"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder={
              isJapanese
                ? "Ngữ cảnh sử dụng, sắc thái trang trọng/thân mật, nét văn hóa..."
                : "Giải thích ngữ nghĩa, cách dùng..."
            }
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* 9 & 10: Câu ví dụ & Dịch nghĩa ví dụ */}
        <div className={isJapanese ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
          <div>
            <label className={labelClass} htmlFor="edit-example">
              💬 {isJapanese ? "9. Câu ví dụ thực tế" : "Ví dụ câu"}
            </label>
            <textarea
              id="edit-example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder={
                isJapanese
                  ? "VD: 春になると桜が綺麗に咲きます。"
                  : "Câu ví dụ thực tế..."
              }
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {isJapanese && (
            <div>
              <label className={labelClass} htmlFor="edit-example-meaning">
                📝 10. Dịch nghĩa câu ví dụ
              </label>
              <textarea
                id="edit-example-meaning"
                value={exampleMeaning}
                onChange={(e) => setExampleMeaning(e.target.value)}
                placeholder="VD: Khi mùa xuân đến, hoa anh đào nở rất đẹp."
                rows={2}
                className={`${inputClass} resize-none italic`}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="submit"
            disabled={saving || imageBusy}
            className="flex-1 cursor-pointer rounded-xl bg-[#4255FF] py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-[#3344DD] active:scale-98 disabled:opacity-50"
          >
            {saving ? "⏳ Đang lưu..." : imageBusy ? "🖼️ Chờ xử lý ảnh..." : "💾 Lưu Thay Đổi"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[#E2E4E9] bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#586380] hover:bg-[#EDEFF4]"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditCardModal({ card, isOpen, onClose, onSave, folderLanguage = "japanese" }: EditCardModalProps) {
  if (!isOpen || !card) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <EditCardFormContent
        card={card}
        onClose={onClose}
        onSave={onSave}
        folderLanguage={folderLanguage}
      />
    </div>
  );
}
