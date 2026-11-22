// Kiểm tra cấu hình Cloudinary: node scripts/check-cloudinary.mjs
// Đọc .env.local / .env, ping API, upload thử 1 ảnh 1x1 rồi xóa ngay.
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const api_key = process.env.CLOUDINARY_API_KEY?.trim();
const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

console.log("CLOUDINARY_CLOUD_NAME :", cloud_name ? `OK (${cloud_name})` : "THIẾU");
console.log("CLOUDINARY_API_KEY    :", api_key ? `OK (${api_key.slice(0, 4)}…)` : "THIẾU");
console.log("CLOUDINARY_API_SECRET :", api_secret ? "OK (đã ẩn)" : "THIẾU");
console.log("CLOUDINARY_URL        :", process.env.CLOUDINARY_URL ? "có" : "không");

if (cloud_name && api_key && api_secret) {
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
} else if (!process.env.CLOUDINARY_URL) {
  console.error("\n✖ Chưa đủ cấu hình. Hãy đặt 3 biến trên (hoặc CLOUDINARY_URL) trong .env.local / Vercel → Settings → Environment Variables.");
  process.exit(1);
}

const msg = (e) => e?.error?.message ?? e?.message ?? String(e);

try {
  const ping = await cloudinary.api.ping();
  console.log("\n✔ Ping API:", ping.status);
} catch (e) {
  console.error("\n✖ Ping thất bại:", msg(e));
  console.error("  → Sai cloud name / API key / API secret, hoặc các giá trị không cùng một tài khoản.");
  process.exit(1);
}

const PNG_1x1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

try {
  const res = await cloudinary.uploader.upload(PNG_1x1, { folder: "Home/_healthcheck" });
  console.log("✔ Upload thử thành công:", res.secure_url);
  await cloudinary.uploader.destroy(res.public_id);
  console.log("✔ Đã xóa ảnh thử. Cloudinary hoạt động bình thường.");
} catch (e) {
  console.error("✖ Upload thử thất bại:", msg(e));
  process.exit(1);
}
