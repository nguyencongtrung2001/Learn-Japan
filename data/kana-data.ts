export type KanaType = "hiragana" | "katakana";
export type KanaGroup = "hiragana" | "katakana" | "dakuten" | "youon";

export interface KanaItem {
  kana: string;
  romaji: string;
  type: KanaType;
  group: KanaGroup;
}

// ============================================================
// HIRAGANA — 46 ký tự cơ bản
// ============================================================
export const hiragana: KanaItem[] = [
  // Vowels
  { kana: "あ", romaji: "a", type: "hiragana", group: "hiragana" },
  { kana: "い", romaji: "i", type: "hiragana", group: "hiragana" },
  { kana: "う", romaji: "u", type: "hiragana", group: "hiragana" },
  { kana: "え", romaji: "e", type: "hiragana", group: "hiragana" },
  { kana: "お", romaji: "o", type: "hiragana", group: "hiragana" },
  // K-row
  { kana: "か", romaji: "ka", type: "hiragana", group: "hiragana" },
  { kana: "き", romaji: "ki", type: "hiragana", group: "hiragana" },
  { kana: "く", romaji: "ku", type: "hiragana", group: "hiragana" },
  { kana: "け", romaji: "ke", type: "hiragana", group: "hiragana" },
  { kana: "こ", romaji: "ko", type: "hiragana", group: "hiragana" },
  // S-row
  { kana: "さ", romaji: "sa", type: "hiragana", group: "hiragana" },
  { kana: "し", romaji: "shi", type: "hiragana", group: "hiragana" },
  { kana: "す", romaji: "su", type: "hiragana", group: "hiragana" },
  { kana: "せ", romaji: "se", type: "hiragana", group: "hiragana" },
  { kana: "そ", romaji: "so", type: "hiragana", group: "hiragana" },
  // T-row
  { kana: "た", romaji: "ta", type: "hiragana", group: "hiragana" },
  { kana: "ち", romaji: "chi", type: "hiragana", group: "hiragana" },
  { kana: "つ", romaji: "tsu", type: "hiragana", group: "hiragana" },
  { kana: "て", romaji: "te", type: "hiragana", group: "hiragana" },
  { kana: "と", romaji: "to", type: "hiragana", group: "hiragana" },
  // N-row
  { kana: "な", romaji: "na", type: "hiragana", group: "hiragana" },
  { kana: "に", romaji: "ni", type: "hiragana", group: "hiragana" },
  { kana: "ぬ", romaji: "nu", type: "hiragana", group: "hiragana" },
  { kana: "ね", romaji: "ne", type: "hiragana", group: "hiragana" },
  { kana: "の", romaji: "no", type: "hiragana", group: "hiragana" },
  // H-row
  { kana: "は", romaji: "ha", type: "hiragana", group: "hiragana" },
  { kana: "ひ", romaji: "hi", type: "hiragana", group: "hiragana" },
  { kana: "ふ", romaji: "fu", type: "hiragana", group: "hiragana" },
  { kana: "へ", romaji: "he", type: "hiragana", group: "hiragana" },
  { kana: "ほ", romaji: "ho", type: "hiragana", group: "hiragana" },
  // M-row
  { kana: "ま", romaji: "ma", type: "hiragana", group: "hiragana" },
  { kana: "み", romaji: "mi", type: "hiragana", group: "hiragana" },
  { kana: "む", romaji: "mu", type: "hiragana", group: "hiragana" },
  { kana: "め", romaji: "me", type: "hiragana", group: "hiragana" },
  { kana: "も", romaji: "mo", type: "hiragana", group: "hiragana" },
  // Y-row
  { kana: "や", romaji: "ya", type: "hiragana", group: "hiragana" },
  { kana: "ゆ", romaji: "yu", type: "hiragana", group: "hiragana" },
  { kana: "よ", romaji: "yo", type: "hiragana", group: "hiragana" },
  // R-row
  { kana: "ら", romaji: "ra", type: "hiragana", group: "hiragana" },
  { kana: "り", romaji: "ri", type: "hiragana", group: "hiragana" },
  { kana: "る", romaji: "ru", type: "hiragana", group: "hiragana" },
  { kana: "れ", romaji: "re", type: "hiragana", group: "hiragana" },
  { kana: "ろ", romaji: "ro", type: "hiragana", group: "hiragana" },
  // W-row + N
  { kana: "わ", romaji: "wa", type: "hiragana", group: "hiragana" },
  { kana: "を", romaji: "wo", type: "hiragana", group: "hiragana" },
  { kana: "ん", romaji: "n", type: "hiragana", group: "hiragana" },
];

// ============================================================
// KATAKANA — 46 ký tự cơ bản
// ============================================================
export const katakana: KanaItem[] = [
  // Vowels
  { kana: "ア", romaji: "a", type: "katakana", group: "katakana" },
  { kana: "イ", romaji: "i", type: "katakana", group: "katakana" },
  { kana: "ウ", romaji: "u", type: "katakana", group: "katakana" },
  { kana: "エ", romaji: "e", type: "katakana", group: "katakana" },
  { kana: "オ", romaji: "o", type: "katakana", group: "katakana" },
  // K-row
  { kana: "カ", romaji: "ka", type: "katakana", group: "katakana" },
  { kana: "キ", romaji: "ki", type: "katakana", group: "katakana" },
  { kana: "ク", romaji: "ku", type: "katakana", group: "katakana" },
  { kana: "ケ", romaji: "ke", type: "katakana", group: "katakana" },
  { kana: "コ", romaji: "ko", type: "katakana", group: "katakana" },
  // S-row
  { kana: "サ", romaji: "sa", type: "katakana", group: "katakana" },
  { kana: "シ", romaji: "shi", type: "katakana", group: "katakana" },
  { kana: "ス", romaji: "su", type: "katakana", group: "katakana" },
  { kana: "セ", romaji: "se", type: "katakana", group: "katakana" },
  { kana: "ソ", romaji: "so", type: "katakana", group: "katakana" },
  // T-row
  { kana: "タ", romaji: "ta", type: "katakana", group: "katakana" },
  { kana: "チ", romaji: "chi", type: "katakana", group: "katakana" },
  { kana: "ツ", romaji: "tsu", type: "katakana", group: "katakana" },
  { kana: "テ", romaji: "te", type: "katakana", group: "katakana" },
  { kana: "ト", romaji: "to", type: "katakana", group: "katakana" },
  // N-row
  { kana: "ナ", romaji: "na", type: "katakana", group: "katakana" },
  { kana: "ニ", romaji: "ni", type: "katakana", group: "katakana" },
  { kana: "ヌ", romaji: "nu", type: "katakana", group: "katakana" },
  { kana: "ネ", romaji: "ne", type: "katakana", group: "katakana" },
  { kana: "ノ", romaji: "no", type: "katakana", group: "katakana" },
  // H-row
  { kana: "ハ", romaji: "ha", type: "katakana", group: "katakana" },
  { kana: "ヒ", romaji: "hi", type: "katakana", group: "katakana" },
  { kana: "フ", romaji: "fu", type: "katakana", group: "katakana" },
  { kana: "ヘ", romaji: "he", type: "katakana", group: "katakana" },
  { kana: "ホ", romaji: "ho", type: "katakana", group: "katakana" },
  // M-row
  { kana: "マ", romaji: "ma", type: "katakana", group: "katakana" },
  { kana: "ミ", romaji: "mi", type: "katakana", group: "katakana" },
  { kana: "ム", romaji: "mu", type: "katakana", group: "katakana" },
  { kana: "メ", romaji: "me", type: "katakana", group: "katakana" },
  { kana: "モ", romaji: "mo", type: "katakana", group: "katakana" },
  // Y-row
  { kana: "ヤ", romaji: "ya", type: "katakana", group: "katakana" },
  { kana: "ユ", romaji: "yu", type: "katakana", group: "katakana" },
  { kana: "ヨ", romaji: "yo", type: "katakana", group: "katakana" },
  // R-row
  { kana: "ラ", romaji: "ra", type: "katakana", group: "katakana" },
  { kana: "リ", romaji: "ri", type: "katakana", group: "katakana" },
  { kana: "ル", romaji: "ru", type: "katakana", group: "katakana" },
  { kana: "レ", romaji: "re", type: "katakana", group: "katakana" },
  { kana: "ロ", romaji: "ro", type: "katakana", group: "katakana" },
  // W-row + N
  { kana: "ワ", romaji: "wa", type: "katakana", group: "katakana" },
  { kana: "ヲ", romaji: "wo", type: "katakana", group: "katakana" },
  { kana: "ン", romaji: "n", type: "katakana", group: "katakana" },
];

// ============================================================
// DAKUTEN & HANDAKUTEN — Âm đục và bán đục
// ============================================================
export const dakuten: KanaItem[] = [
  // Hiragana Dakuten
  { kana: "が", romaji: "ga", type: "hiragana", group: "dakuten" },
  { kana: "ぎ", romaji: "gi", type: "hiragana", group: "dakuten" },
  { kana: "ぐ", romaji: "gu", type: "hiragana", group: "dakuten" },
  { kana: "げ", romaji: "ge", type: "hiragana", group: "dakuten" },
  { kana: "ご", romaji: "go", type: "hiragana", group: "dakuten" },
  { kana: "ざ", romaji: "za", type: "hiragana", group: "dakuten" },
  { kana: "じ", romaji: "ji", type: "hiragana", group: "dakuten" },
  { kana: "ず", romaji: "zu", type: "hiragana", group: "dakuten" },
  { kana: "ぜ", romaji: "ze", type: "hiragana", group: "dakuten" },
  { kana: "ぞ", romaji: "zo", type: "hiragana", group: "dakuten" },
  { kana: "だ", romaji: "da", type: "hiragana", group: "dakuten" },
  { kana: "ぢ", romaji: "di", type: "hiragana", group: "dakuten" },
  { kana: "づ", romaji: "du", type: "hiragana", group: "dakuten" },
  { kana: "で", romaji: "de", type: "hiragana", group: "dakuten" },
  { kana: "ど", romaji: "do", type: "hiragana", group: "dakuten" },
  { kana: "ば", romaji: "ba", type: "hiragana", group: "dakuten" },
  { kana: "び", romaji: "bi", type: "hiragana", group: "dakuten" },
  { kana: "ぶ", romaji: "bu", type: "hiragana", group: "dakuten" },
  { kana: "べ", romaji: "be", type: "hiragana", group: "dakuten" },
  { kana: "ぼ", romaji: "bo", type: "hiragana", group: "dakuten" },
  // Handakuten
  { kana: "ぱ", romaji: "pa", type: "hiragana", group: "dakuten" },
  { kana: "ぴ", romaji: "pi", type: "hiragana", group: "dakuten" },
  { kana: "ぷ", romaji: "pu", type: "hiragana", group: "dakuten" },
  { kana: "ぺ", romaji: "pe", type: "hiragana", group: "dakuten" },
  { kana: "ぽ", romaji: "po", type: "hiragana", group: "dakuten" },
  // Katakana Dakuten
  { kana: "ガ", romaji: "ga", type: "katakana", group: "dakuten" },
  { kana: "ギ", romaji: "gi", type: "katakana", group: "dakuten" },
  { kana: "グ", romaji: "gu", type: "katakana", group: "dakuten" },
  { kana: "ゲ", romaji: "ge", type: "katakana", group: "dakuten" },
  { kana: "ゴ", romaji: "go", type: "katakana", group: "dakuten" },
  { kana: "ザ", romaji: "za", type: "katakana", group: "dakuten" },
  { kana: "ジ", romaji: "ji", type: "katakana", group: "dakuten" },
  { kana: "ズ", romaji: "zu", type: "katakana", group: "dakuten" },
  { kana: "ゼ", romaji: "ze", type: "katakana", group: "dakuten" },
  { kana: "ゾ", romaji: "zo", type: "katakana", group: "dakuten" },
  { kana: "ダ", romaji: "da", type: "katakana", group: "dakuten" },
  { kana: "ヂ", romaji: "di", type: "katakana", group: "dakuten" },
  { kana: "ヅ", romaji: "du", type: "katakana", group: "dakuten" },
  { kana: "デ", romaji: "de", type: "katakana", group: "dakuten" },
  { kana: "ド", romaji: "do", type: "katakana", group: "dakuten" },
  { kana: "バ", romaji: "ba", type: "katakana", group: "dakuten" },
  { kana: "ビ", romaji: "bi", type: "katakana", group: "dakuten" },
  { kana: "ブ", romaji: "bu", type: "katakana", group: "dakuten" },
  { kana: "ベ", romaji: "be", type: "katakana", group: "dakuten" },
  { kana: "ボ", romaji: "bo", type: "katakana", group: "dakuten" },
  // Katakana Handakuten
  { kana: "パ", romaji: "pa", type: "katakana", group: "dakuten" },
  { kana: "ピ", romaji: "pi", type: "katakana", group: "dakuten" },
  { kana: "プ", romaji: "pu", type: "katakana", group: "dakuten" },
  { kana: "ペ", romaji: "pe", type: "katakana", group: "dakuten" },
  { kana: "ポ", romaji: "po", type: "katakana", group: "dakuten" },
];

// ============================================================
// YOUON — Âm ghép (Combination sounds)
// ============================================================
export const youon: KanaItem[] = [
  // Hiragana Youon
  { kana: "きゃ", romaji: "kya", type: "hiragana", group: "youon" },
  { kana: "きゅ", romaji: "kyu", type: "hiragana", group: "youon" },
  { kana: "きょ", romaji: "kyo", type: "hiragana", group: "youon" },
  { kana: "しゃ", romaji: "sha", type: "hiragana", group: "youon" },
  { kana: "しゅ", romaji: "shu", type: "hiragana", group: "youon" },
  { kana: "しょ", romaji: "sho", type: "hiragana", group: "youon" },
  { kana: "ちゃ", romaji: "cha", type: "hiragana", group: "youon" },
  { kana: "ちゅ", romaji: "chu", type: "hiragana", group: "youon" },
  { kana: "ちょ", romaji: "cho", type: "hiragana", group: "youon" },
  { kana: "にゃ", romaji: "nya", type: "hiragana", group: "youon" },
  { kana: "にゅ", romaji: "nyu", type: "hiragana", group: "youon" },
  { kana: "にょ", romaji: "nyo", type: "hiragana", group: "youon" },
  { kana: "ひゃ", romaji: "hya", type: "hiragana", group: "youon" },
  { kana: "ひゅ", romaji: "hyu", type: "hiragana", group: "youon" },
  { kana: "ひょ", romaji: "hyo", type: "hiragana", group: "youon" },
  { kana: "みゃ", romaji: "mya", type: "hiragana", group: "youon" },
  { kana: "みゅ", romaji: "myu", type: "hiragana", group: "youon" },
  { kana: "みょ", romaji: "myo", type: "hiragana", group: "youon" },
  { kana: "りゃ", romaji: "rya", type: "hiragana", group: "youon" },
  { kana: "りゅ", romaji: "ryu", type: "hiragana", group: "youon" },
  { kana: "りょ", romaji: "ryo", type: "hiragana", group: "youon" },
  { kana: "ぎゃ", romaji: "gya", type: "hiragana", group: "youon" },
  { kana: "ぎゅ", romaji: "gyu", type: "hiragana", group: "youon" },
  { kana: "ぎょ", romaji: "gyo", type: "hiragana", group: "youon" },
  { kana: "じゃ", romaji: "ja", type: "hiragana", group: "youon" },
  { kana: "じゅ", romaji: "ju", type: "hiragana", group: "youon" },
  { kana: "じょ", romaji: "jo", type: "hiragana", group: "youon" },
  { kana: "びゃ", romaji: "bya", type: "hiragana", group: "youon" },
  { kana: "びゅ", romaji: "byu", type: "hiragana", group: "youon" },
  { kana: "びょ", romaji: "byo", type: "hiragana", group: "youon" },
  { kana: "ぴゃ", romaji: "pya", type: "hiragana", group: "youon" },
  { kana: "ぴゅ", romaji: "pyu", type: "hiragana", group: "youon" },
  { kana: "ぴょ", romaji: "pyo", type: "hiragana", group: "youon" },
  // Katakana Youon
  { kana: "キャ", romaji: "kya", type: "katakana", group: "youon" },
  { kana: "キュ", romaji: "kyu", type: "katakana", group: "youon" },
  { kana: "キョ", romaji: "kyo", type: "katakana", group: "youon" },
  { kana: "シャ", romaji: "sha", type: "katakana", group: "youon" },
  { kana: "シュ", romaji: "shu", type: "katakana", group: "youon" },
  { kana: "ショ", romaji: "sho", type: "katakana", group: "youon" },
  { kana: "チャ", romaji: "cha", type: "katakana", group: "youon" },
  { kana: "チュ", romaji: "chu", type: "katakana", group: "youon" },
  { kana: "チョ", romaji: "cho", type: "katakana", group: "youon" },
  { kana: "ニャ", romaji: "nya", type: "katakana", group: "youon" },
  { kana: "ニュ", romaji: "nyu", type: "katakana", group: "youon" },
  { kana: "ニョ", romaji: "nyo", type: "katakana", group: "youon" },
  { kana: "ヒャ", romaji: "hya", type: "katakana", group: "youon" },
  { kana: "ヒュ", romaji: "hyu", type: "katakana", group: "youon" },
  { kana: "ヒョ", romaji: "hyo", type: "katakana", group: "youon" },
  { kana: "ミャ", romaji: "mya", type: "katakana", group: "youon" },
  { kana: "ミュ", romaji: "myu", type: "katakana", group: "youon" },
  { kana: "ミョ", romaji: "myo", type: "katakana", group: "youon" },
  { kana: "リャ", romaji: "rya", type: "katakana", group: "youon" },
  { kana: "リュ", romaji: "ryu", type: "katakana", group: "youon" },
  { kana: "リョ", romaji: "ryo", type: "katakana", group: "youon" },
  { kana: "ギャ", romaji: "gya", type: "katakana", group: "youon" },
  { kana: "ギュ", romaji: "gyu", type: "katakana", group: "youon" },
  { kana: "ギョ", romaji: "gyo", type: "katakana", group: "youon" },
  { kana: "ジャ", romaji: "ja", type: "katakana", group: "youon" },
  { kana: "ジュ", romaji: "ju", type: "katakana", group: "youon" },
  { kana: "ジョ", romaji: "jo", type: "katakana", group: "youon" },
  { kana: "ビャ", romaji: "bya", type: "katakana", group: "youon" },
  { kana: "ビュ", romaji: "byu", type: "katakana", group: "youon" },
  { kana: "ビョ", romaji: "byo", type: "katakana", group: "youon" },
  { kana: "ピャ", romaji: "pya", type: "katakana", group: "youon" },
  { kana: "ピュ", romaji: "pyu", type: "katakana", group: "youon" },
  { kana: "ピョ", romaji: "pyo", type: "katakana", group: "youon" },
];

// ============================================================
// Helper functions
// ============================================================

const allKana: KanaItem[] = [...hiragana, ...katakana, ...dakuten, ...youon];

export function getByGroup(groups: KanaGroup[]): KanaItem[] {
  return allKana.filter((item) => groups.includes(item.group));
}

export function getAll(): KanaItem[] {
  return [...allKana];
}

export function getGroupInfo(): {
  id: KanaGroup;
  name: string;
  nameJp: string;
  description: string;
  count: number;
  icon: string;
}[] {
  return [
    {
      id: "hiragana",
      name: "Hiragana",
      nameJp: "ひらがな",
      description: "46 ký tự cơ bản — nền tảng của tiếng Nhật",
      count: hiragana.length,
      icon: "あ",
    },
    {
      id: "katakana",
      name: "Katakana",
      nameJp: "カタカナ",
      description: "46 ký tự — dùng cho từ nước ngoài",
      count: katakana.length,
      icon: "ア",
    },
    {
      id: "dakuten",
      name: "Dakuten & Handakuten",
      nameJp: "濁点・半濁点",
      description: "Âm đục và bán đục — が, ぱ...",
      count: dakuten.length,
      icon: "が",
    },
    {
      id: "youon",
      name: "Youon",
      nameJp: "拗音",
      description: "Âm ghép — きゃ, しゅ, ちょ...",
      count: youon.length,
      icon: "きょ",
    },
  ];
}
