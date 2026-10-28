/**
 * Tính toán chuỗi ngày học từ dữ liệu lưu trong localStorage ("studyStreak_global").
 */
export function calculateStudyStreak(dates: string[]): {
  consecutive: number;
  total: number;
  displayCount: number;
} {
  if (!dates || dates.length === 0) {
    return { consecutive: 0, total: 0, displayCount: 0 };
  }

  const set = new Set(dates);
  const now = new Date();
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  let consecutive = 0;
  const cursor = new Date(now);

  const todayKey = formatDate(cursor);
  if (set.has(todayKey)) {
    consecutive++;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    // Nếu hôm nay chưa học, chuỗi vẫn được duy trì nếu hôm qua đã học
    cursor.setDate(cursor.getDate() - 1);
    if (set.has(formatDate(cursor))) {
      consecutive++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  while (consecutive > 0 && set.has(formatDate(cursor))) {
    consecutive++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const total = set.size;
  // Ưu tiên hiển thị chuỗi liên tục, nếu chuỗi = 0 nhưng đã có ngày học trong Theo dõi thì hiển thị tổng ngày đã học
  const displayCount = consecutive > 0 ? consecutive : total;

  return { consecutive, total, displayCount };
}
