export type AppLanguage = "vi" | "en" | "ja";

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "vi", label: "Vietnam (Tiếng Việt)", nativeLabel: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "ja", label: "Nihon 日本語", nativeLabel: "日本語", flag: "🇯🇵" },
];

export const translations = {
  nav: {
    home: { vi: "Trang chủ", en: "Home", ja: "ホーム" },
    folders: { vi: "Bộ thẻ", en: "Flashcards", ja: "単語帳" },
    alphabet: { vi: "Bảng chữ cái", en: "Alphabet", ja: "50音表" },
    tracker: { vi: "Theo dõi", en: "Tracker", ja: "学習記録" },
    notes: { vi: "Ghi chú", en: "Notes", ja: "メモ" },
  },
  theme: {
    toggle: { vi: "Đổi giao diện sáng/tối", en: "Toggle light/dark theme", ja: "明暗テーマ切り替え" },
    dark: { vi: "Chế độ tối", en: "Dark Mode", ja: "ダークモード" },
    light: { vi: "Chế độ sáng", en: "Light Mode", ja: "ライトモード" },
  },
  lang: {
    select: { vi: "Chọn ngôn ngữ", en: "Select language", ja: "言語を選択" },
  },
  actions: {
    openFolder: { vi: "Mở Thư Mục", en: "Open Set", ja: "フォルダを開く" },
    createFolder: { vi: "Tạo Thư Mục Mới", en: "Create New Set", ja: "新規フォルダ作成" },
    addCard: { vi: "Thêm Thẻ", en: "Add Card", ja: "カード追加" },
    importExcel: { vi: "Nhập File Excel", en: "Import Excel", ja: "Excel取り込み" },
    manage: { vi: "Quản lý", en: "Manage", ja: "管理" },
    flashcard: { vi: "Flashcard", en: "Flashcards", ja: "フラッシュカード" },
    split: { vi: "Split-View", en: "Split-View", ja: "分割表示" },
    autoplay: { vi: "Phát tự động", en: "Autoplay", ja: "自動再生" },
    pause: { vi: "Dừng", en: "Pause", ja: "停止" },
    flipHint: { vi: "Chạm hoặc bấm Space để lật thẻ", en: "Click or press Space to flip", ja: "クリックまたはSpaceでめくる" },
    term: { vi: "Thuật ngữ", en: "Term", ja: "用語" },
    definition: { vi: "Định nghĩa", en: "Definition", ja: "定義" },
    back: { vi: "Quay lại", en: "Back", ja: "戻る" },
    startStudy: { vi: "Bắt Đầu Học Ngay", en: "Start Studying", ja: "今すぐ学習" },
    reviewSchedule: { vi: "Lịch Ôn Tập", en: "Review Schedule", ja: "復習予定" },
  },
  common: {
    cards: { vi: "thẻ", en: "cards", ja: "枚" },
    all: { vi: "Tất cả", en: "All", ja: "すべて" },
    completed: { vi: "Đã thuộc", en: "Mastered", ja: "習得済み" },
    learning: { vi: "Đang học", en: "Studying", ja: "学習中" },
    notStarted: { vi: "Chưa học", en: "Not started", ja: "未学習" },
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function getTranslation<S extends keyof typeof translations, K extends keyof (typeof translations)[S]>(
  section: S,
  key: K,
  lang: AppLanguage = "vi"
): string {
  const sec = translations[section] as Record<string, Record<AppLanguage, string>>;
  if (sec && sec[key as string]) {
    return sec[key as string][lang] || sec[key as string].vi;
  }
  return String(key);
}
