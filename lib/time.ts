/**
 * Thời điểm hiện tại (ms) lấy trên SERVER rồi truyền xuống client làm prop,
 * để việc tính "thẻ đến hạn ôn" giống hệt nhau giữa server render và hydration.
 */
export function getServerNow(): number {
  return Date.now();
}
