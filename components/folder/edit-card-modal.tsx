"use client";

import { useState } from "react";
import type { CardListItem, CardInput } from "@/lib/card-utils";

interface EditCardModalProps {
  card: CardListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: CardInput) => Promise<boolean>;
  folderLanguage?: string;
}

const inputClass =
  "w-full rounded-xl border-2 border-border/50 bg-surface/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-foreground-muted/40 focus:border-indigo focus:ring-4 focus:ring-indigo/10";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-foreground-muted";

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
  const [translation, setTranslation] = useState(card.translation);
  const [partOfSpeech, setPartOfSpeech] = useState(card.partOfSpeech ?? "");
  const [phonetic, setPhonetic] = useState(card.phonetic ?? "");
  const [definition, setDefinition] = useState(card.definition ?? "");
  const [example, setExample] = useState(card.example ?? "");
  const [imageUrl, setImageUrl] = useState(card.imageUrl ?? "");
  const [saving, setSaving] = useState(false);

  const isJapanese = folderLanguage === "japanese";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) {
      alert("Từ vựng và Nghĩa tiếng Việt không được để trống!");
      return;
    }

    setSaving(true);
    const ok = await onSave(card.id, {
      word: word.trim(),
      kanji: kanji.trim() || undefined,
      translation: translation.trim(),
      partOfSpeech: partOfSpeech.trim() || undefined,
      phonetic: phonetic.trim() || undefined,
      definition: definition.trim() || undefined,
      example: example.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    });
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="glass-card relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-scale-bounce sm:p-8"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-indigo to-sakura opacity-70" />

      <div className="mb-6 flex items-center justify-between">
        <h3 className="gradient-text text-xl font-extrabold flex items-center gap-2">
          <span>✏️</span> {isJapanese ? "Chỉnh Sửa Thẻ Tiếng Nhật" : "Chỉnh Sửa Thẻ Từ Vựng"}
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
        <div className={isJapanese ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
          <div>
            <label className={labelClass} htmlFor="edit-word">
              {isJapanese ? "Từ vựng / Kana (Hiragana/Katakana)" : "Từ vựng"}{" "}
              <span className="text-rose">*</span>
            </label>
            <input
              id="edit-word"
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={isJapanese ? "VD: さくら / たべる" : "VD: apple"}
              className={`${inputClass} text-lg font-bold`}
            />
          </div>

          {isJapanese && (
            <div>
              <label className={labelClass} htmlFor="edit-kanji">
                🈁 Chữ Hán (Kanji)
              </label>
              <input
                id="edit-kanji"
                type="text"
                value={kanji}
                onChange={(e) => setKanji(e.target.value)}
                placeholder="VD: 桜 hoặc 食べる hoặc 一期一会"
                className={`${inputClass} text-lg font-bold text-sakura-light`}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="edit-pos">
              Loại từ
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
              <option value="Trợ từ (助詞)" />
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
              placeholder={isJapanese ? "Hoa anh đào" : "Quả táo"}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-phonetic">
              {isJapanese ? "Furigana / Romaji" : "Phiên âm IPA"}
            </label>
            <input
              id="edit-phonetic"
              type="text"
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
              placeholder={isJapanese ? "さくら / sakura" : "/ˈæp.əl/"}
              className={`${inputClass} text-indigo-light`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-imageUrl">
            🖼️ Hình ảnh nghĩa cốt lõi (Link URL)
          </label>
          <input
            id="edit-imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... (link hình ảnh minh họa cốt lõi)"
            className={`${inputClass} font-mono text-xs`}
          />
          {imageUrl.trim() && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/80 bg-surface/50 p-2">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl.trim()}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={() => {}}
                />
              </div>
              <div className="text-xs text-foreground-dim line-clamp-2 font-mono">
                {imageUrl.trim()}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-definition">
            💡 {isJapanese ? "Ngữ cảnh sử dụng & Sắc thái" : "Định nghĩa / Ngữ cảnh sử dụng"}
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

        <div>
          <label className={labelClass} htmlFor="edit-example">
            💬 {isJapanese ? "Câu ví dụ thực tế (kèm dịch nghĩa)" : "Ví dụ câu"}
          </label>
          <textarea
            id="edit-example"
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder={
              isJapanese
                ? "Câu ví dụ tiếng Nhật và dịch nghĩa..."
                : "Câu ví dụ thực tế..."
            }
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
  );
}

export function EditCardModal({ card, isOpen, onClose, onSave, folderLanguage = "japanese" }: EditCardModalProps) {
  if (!isOpen || !card) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <EditCardFormContent
        key={card.id}
        card={card}
        onClose={onClose}
        onSave={onSave}
        folderLanguage={folderLanguage}
      />
    </div>
  );
}
