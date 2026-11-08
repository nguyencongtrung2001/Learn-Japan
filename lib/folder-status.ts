export type FolderStatus = "completed" | "learning" | "not_started";

export interface FolderStatusInfo {
  status: FolderStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: string;
}

/**
 * Tính toán trạng thái thư mục dựa trên số lượng từ và mức độ học:
 * - "not_started": Chưa có thẻ nào HOẶC chưa có thẻ nào được học (màu vàng)
 * - "completed": Có thẻ và tất cả các thẻ đều đã thành thạo (growthLevel >= 5) (màu xanh lá)
 * - "learning": Đang có thẻ đang trong tiến trình học (màu xanh dương / indigo)
 */
export function getFolderStatus(
  cardCount: number,
  learnedCount: number = 0,
  studyingCount: number = 0
): FolderStatusInfo {
  // 1. Đã tạo nhưng chưa học (màu vàng)
  if (cardCount === 0 || (learnedCount === 0 && studyingCount === 0)) {
    return {
      status: "not_started",
      label: "Đã tạo nhưng chưa học",
      icon: "⏳",
      badgeClass:
        "border-amber-500/40 bg-amber-500/10 text-amber-500 dark:text-amber-400 shadow-sm shadow-amber-500/10",
      dotClass: "bg-amber-400 animate-pulse",
    };
  }

  // 2. Đã hoàn thành (màu xanh lá)
  if (learnedCount >= cardCount && cardCount > 0) {
    return {
      status: "completed",
      label: "Đã hoàn thành",
      icon: "✅",
      badgeClass:
        "border-emerald/40 bg-emerald/10 text-emerald shadow-sm shadow-emerald/10",
      dotClass: "bg-emerald",
    };
  }

  // 3. Đang học (màu xanh dương / indigo)
  return {
    status: "learning",
    label: "Đang học",
    icon: "📖",
    badgeClass:
      "border-indigo/40 bg-indigo/10 text-indigo-light shadow-sm shadow-indigo/10",
    dotClass: "bg-indigo-400",
  };
}
