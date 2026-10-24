import { splitAnswers } from "./quiz";

export interface SentenceCorrection {
  type: "grammar" | "spelling" | "style" | "missing_keyword";
  message: string;
  original?: string;
  replacement?: string;
}

export interface SentenceCheckResult {
  isValid: boolean; // true nếu câu đúng hoặc chỉ có lỗi trình bày nhỏ
  score: "perfect" | "good" | "needs_improvement" | "invalid";
  hasKeyword: boolean;
  matchedKeyword?: string;
  suggestions: SentenceCorrection[];
  correctedSentence?: string;
  modelSentence?: string;
}

/**
 * Thuật toán kiểm tra câu tiếng Anh ngoại tuyến (Rule-based & NLP):
 * 1. Kiểm tra sự xuất hiện của từ khóa (hoặc biến thể quá khứ, tiếp diễn, số nhiều, v.v.)
 * 2. Kiểm tra độ dài và cấu trúc câu tối thiểu
 * 3. Kiểm tra viết hoa đầu câu và đại từ "I"
 * 4. Kiểm tra dấu câu kết thúc
 * 5. Kiểm tra lặp từ liên tiếp
 * 6. Kiểm tra hòa hợp chủ vị (Subject-Verb Agreement: he/she/it, don't vs doesn't, is vs are)
 * 7. Kiểm tra mạo từ (a vs an trước nguyên âm/phụ âm)
 * 8. Kiểm tra động từ sau trợ động từ (can, will, should...) và sau to-infinitive
 */
export function checkSentenceLocally(
  sentence: string,
  targetWord: string,
  modelExample?: string | null
): SentenceCheckResult {
  const raw = sentence.trim();
  const suggestions: SentenceCorrection[] = [];

  if (!raw) {
    return {
      isValid: false,
      score: "invalid",
      hasKeyword: false,
      suggestions: [
        {
          type: "missing_keyword",
          message: "Vui lòng nhập một câu tiếng Anh hoàn chỉnh.",
        },
      ],
      modelSentence: modelExample || undefined,
    };
  }

  // 1. Kiểm tra sự xuất hiện của từ khóa hoặc biến thể
  const candidates = splitAnswers(targetWord);
  let hasKeyword = false;
  let matchedKeyword = "";

  const words = raw.split(/\s+/).filter((w) => w.length > 0);

  for (const cand of candidates) {
    const cLower = cand.toLowerCase().replace(/[()[\]{}]/g, "").trim();
    // Bỏ "to " ở đầu nếu là động từ nguyên mẫu (VD: "to accomplish" -> "accomplish")
    const base = cLower.startsWith("to ") ? cLower.slice(3).trim() : cLower;
    if (!base) continue;

    // Thoát ký tự đặc biệt để đưa vào Regex
    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Nhận diện từ gốc hoặc các hậu tố: -s, -es, -d, -ed, -ing, -ly, -er, -est, -able, -ive
    const keywordRegex = new RegExp(
      `\\b${escaped}(?:s|es|d|ed|ing|ly|er|est|r|able|ive)?\\b`,
      "i"
    );

    if (keywordRegex.test(raw)) {
      hasKeyword = true;
      matchedKeyword = base;
      break;
    }
  }

  if (!hasKeyword) {
    suggestions.push({
      type: "missing_keyword",
      message: `Câu của bạn chưa chứa từ khóa "${targetWord}". Hãy đưa từ này vào câu.`,
    });
  }

  // 2. Kiểm tra độ dài tối thiểu của câu (ít nhất 3 từ: S + V + O)
  if (words.length < 3) {
    suggestions.push({
      type: "style",
      message:
        "Câu quá ngắn. Một câu hoàn chỉnh cần có ít nhất Chủ ngữ và Động từ (tối thiểu 3 từ).",
    });
  }

  // 3. Viết hoa đầu câu
  let corrected = raw;
  const firstChar = raw.charAt(0);
  if (firstChar >= "a" && firstChar <= "z") {
    const capitalized = firstChar.toUpperCase() + raw.slice(1);
    suggestions.push({
      type: "grammar",
      message: `Nên viết hoa chữ cái đầu câu: "${firstChar.toUpperCase()}".`,
      original: firstChar,
      replacement: firstChar.toUpperCase(),
    });
    corrected = capitalized;
  }

  // Viết hoa đại từ "I" khi đứng độc lập
  if (/\bi\b/.test(corrected)) {
    suggestions.push({
      type: "grammar",
      message: 'Đại từ nhân xưng "I" (tôi) trong tiếng Anh luôn luôn phải viết hoa.',
      original: "i",
      replacement: "I",
    });
    corrected = corrected.replace(/\bi\b/g, "I");
  }

  // 4. Dấu câu kết thúc
  const lastChar = corrected.slice(-1);
  if (![".", "!", "?", '"', "'"].includes(lastChar)) {
    suggestions.push({
      type: "style",
      message: "Nên kết thúc câu bằng dấu chấm (.), dấu hỏi (?) hoặc dấu than (!).",
    });
    corrected = corrected + ".";
  }

  // 5. Kiểm tra lặp từ liên tiếp (VD: "the the", "is is")
  const duplicateMatch = corrected.match(/\b([a-zA-Z]{2,})\s+\1\b/i);
  if (duplicateMatch) {
    suggestions.push({
      type: "grammar",
      message: `Phát hiện từ lặp lại liên tiếp: "${duplicateMatch[0]}".`,
      original: duplicateMatch[0],
      replacement: duplicateMatch[1],
    });
    corrected = corrected.replace(
      new RegExp(`\\b${duplicateMatch[1]}\\s+${duplicateMatch[1]}\\b`, "gi"),
      duplicateMatch[1]
    );
  }

  // 6. Kiểm tra hòa hợp chủ vị (Subject-Verb Agreement)
  const heSheItVerb = corrected.match(
    /\b(he|she|it)\s+(go|do|have|want|need|like|play|work|eat|see|make|say|know|take|think|come|give|look|use|find|tell|ask|feel|try|leave|call|run|study|watch)\b/i
  );
  if (heSheItVerb) {
    const subj = heSheItVerb[1];
    const verb = heSheItVerb[2].toLowerCase();
    let correctVerb = verb + "s";
    if (verb === "have") correctVerb = "has";
    else if (verb === "go") correctVerb = "goes";
    else if (verb === "do") correctVerb = "does";
    else if (verb === "watch" || verb === "wash") correctVerb = verb + "es";
    else if (verb === "study" || verb === "try") correctVerb = verb.slice(0, -1) + "ies";

    suggestions.push({
      type: "grammar",
      message: `Chủ ngữ ngôi thứ ba số ít "${subj}" cần chia động từ ở hiện tại: "${correctVerb}".`,
      original: heSheItVerb[0],
      replacement: `${subj} ${correctVerb}`,
    });
    corrected = corrected.replace(
      new RegExp(`\\b${subj}\\s+${verb}\\b`, "i"),
      `${subj} ${correctVerb}`
    );
  }

  // he/she/it don't -> doesn't
  const heSheDont = corrected.match(/\b(he|she|it)\s+don't\b/i);
  if (heSheDont) {
    suggestions.push({
      type: "grammar",
      message: `Với chủ ngữ "${heSheDont[1]}", nên dùng "doesn't" thay vì "don't".`,
      original: heSheDont[0],
      replacement: `${heSheDont[1]} doesn't`,
    });
    corrected = corrected.replace(
      new RegExp(`\\b${heSheDont[1]}\\s+don't\\b`, "i"),
      `${heSheDont[1]} doesn't`
    );
  }

  // they/we/you is -> are
  const theyWeIs = corrected.match(/\b(they|we|you)\s+is\b/i);
  if (theyWeIs) {
    suggestions.push({
      type: "grammar",
      message: `Chủ ngữ số nhiều "${theyWeIs[1]}" đi với động từ to be "are", không dùng "is".`,
      original: theyWeIs[0],
      replacement: `${theyWeIs[1]} are`,
    });
    corrected = corrected.replace(
      new RegExp(`\\b${theyWeIs[1]}\\s+is\\b`, "i"),
      `${theyWeIs[1]} are`
    );
  }

  // I is / I are -> I am
  const iIs = corrected.match(/\bI\s+(?:is|are)\b/i);
  if (iIs) {
    suggestions.push({
      type: "grammar",
      message: `Chủ ngữ "I" đi với động từ to be "am".`,
      original: iIs[0],
      replacement: "I am",
    });
    corrected = corrected.replace(/\bI\s+(?:is|are)\b/i, "I am");
  }

  // 7. Mạo từ a / an
  const aBeforeVowel = corrected.match(
    /\ba\s+(apple|orange|elephant|egg|hour|honest|honor|island|umbrella|actor|actress|idea|opportunity|easy|important|interesting|accident|animal|uncle)\b/i
  );
  if (aBeforeVowel) {
    suggestions.push({
      type: "grammar",
      message: `Dùng "an" trước từ bắt đầu bằng nguyên âm/âm câm: "an ${aBeforeVowel[1]}".`,
      original: aBeforeVowel[0],
      replacement: `an ${aBeforeVowel[1]}`,
    });
    corrected = corrected.replace(
      new RegExp(`\\ba\\s+${aBeforeVowel[1]}\\b`, "i"),
      `an ${aBeforeVowel[1]}`
    );
  }

  const anBeforeConsonant = corrected.match(
    /\ban\s+(university|uniform|unique|unit|user|european|one|book|car|dog|cat|house|man|woman|day|job|friend|computer|table)\b/i
  );
  if (anBeforeConsonant) {
    suggestions.push({
      type: "grammar",
      message: `Dùng "a" trước từ bắt đầu bằng phụ âm: "a ${anBeforeConsonant[1]}".`,
      original: anBeforeConsonant[0],
      replacement: `a ${anBeforeConsonant[1]}`,
    });
    corrected = corrected.replace(
      new RegExp(`\\ban\\s+${anBeforeConsonant[1]}\\b`, "i"),
      `a ${anBeforeConsonant[1]}`
    );
  }

  // 8. Động từ sau trợ động từ khuyết thiếu (can, will, should, must)
  const modalWithInflected = corrected.match(
    /\b(can|could|will|would|should|must|might|may)\s+([a-z]+(?:ed|ing))\b/i
  );
  if (modalWithInflected) {
    suggestions.push({
      type: "grammar",
      message: `Sau trợ động từ "${modalWithInflected[1]}", động từ phải ở dạng nguyên thể không chia.`,
      original: modalWithInflected[0],
    });
  }

  // Đánh giá điểm tổng thể
  let score: "perfect" | "good" | "needs_improvement" | "invalid" = "perfect";
  let isValid = true;

  if (!hasKeyword || words.length < 3) {
    score = "invalid";
    isValid = false;
  } else if (suggestions.some((s) => s.type === "grammar")) {
    score = "needs_improvement";
    isValid = false;
  } else if (suggestions.length > 0) {
    score = "good";
    isValid = true;
  }

  return {
    isValid,
    score,
    hasKeyword,
    matchedKeyword,
    suggestions,
    correctedSentence: corrected !== raw ? corrected : undefined,
    modelSentence: modelExample || undefined,
  };
}
