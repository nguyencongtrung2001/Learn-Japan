import { NextRequest, NextResponse } from "next/server";
import {
  v2 as cloudinary,
  type UploadApiOptions,
  type UploadApiResponse,
} from "cloudinary";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export const maxDuration = 30;

// Vercel giới hạn body của Serverless Function ở ~4.5MB → để 4MB cho an toàn
// (client đã tự nén ảnh lớn trước khi gửi, xem components/folder/image-uploader.tsx).
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const IS_PROD = process.env.NODE_ENV === "production";

type ErrorBody = { error: string; code: string };

function fail(error: string, code: string, status: number) {
  return NextResponse.json<ErrorBody>({ error, code }, { status });
}

/**
 * Cấu hình Cloudinary từ 3 biến riêng lẻ, hoặc CLOUDINARY_URL
 * (SDK tự đọc CLOUDINARY_URL khi khởi tạo). Trả về false nếu thiếu cấu hình.
 */
function configureCloudinary(): boolean {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    return true;
  }

  const cfg = cloudinary.config();
  return Boolean(cfg.cloud_name && cfg.api_key && cfg.api_secret);
}

/** Cloudinary reject bằng object {message, http_code} (đôi khi bọc trong .error). */
function readCloudinaryError(err: unknown): { message: string; httpCode?: number } {
  const raw = (typeof err === "object" && err !== null ? err : {}) as Record<string, unknown>;
  const inner = (typeof raw.error === "object" && raw.error !== null ? raw.error : raw) as Record<
    string,
    unknown
  >;
  const message =
    typeof inner.message === "string" && inner.message
      ? inner.message
      : err instanceof Error
        ? err.message
        : "Lỗi không xác định từ Cloudinary";
  const httpCode = typeof inner.http_code === "number" ? inner.http_code : undefined;
  return { message, httpCode };
}

function uploadOptions(folder: string, mimeType?: string): UploadApiOptions {
  const options: UploadApiOptions = { folder, resource_type: "image" };
  // Giới hạn kích thước ảnh gốc lưu trên Cloudinary (tiết kiệm dung lượng/băng thông).
  if (mimeType !== "image/svg+xml") {
    options.transformation = [{ width: 1600, height: 1600, crop: "limit" }];
  }
  return options;
}

function uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err || !result) return reject(err ?? new Error("Cloudinary không trả về kết quả."));
      resolve(result);
    });
    stream.end(buffer);
  });
}

/** CHỈ dùng khi chạy dev mà chưa cấu hình Cloudinary. Production không bao giờ dùng. */
async function saveLocallyForDev(buffer: Buffer, mimeType: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = EXT_MAP[mimeType] || "jpg";
  const uniqueName = `img-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(uploadDir, uniqueName), buffer);
  return `/uploads/${uniqueName}`;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("Không đọc được dữ liệu gửi lên (file quá lớn hoặc sai định dạng).", "bad_request", 400);
  }

  const file = formData.get("file");
  const remoteUrl = (formData.get("url") as string | null)?.trim();
  const language = (formData.get("language") as string) || "english";
  const folder = language === "japanese" ? "Home/Japan" : "Home/English";

  if (!(file instanceof File) && !remoteUrl) {
    return fail("Chưa cung cấp file ảnh hoặc link URL.", "missing_input", 400);
  }

  const configured = configureCloudinary();

  // ─── TRƯỜNG HỢP 1: DÁN LINK URL ───
  // Cloudinary tự tải ảnh từ link → server của mình không fetch URL lạ (tránh SSRF).
  if (remoteUrl) {
    let parsed: URL;
    try {
      parsed = new URL(remoteUrl);
    } catch {
      return fail("Link ảnh không hợp lệ.", "invalid_url", 400);
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return fail("Chỉ hỗ trợ link http/https.", "invalid_url", 400);
    }
    if (!configured) {
      return fail(
        "Server chưa cấu hình Cloudinary (thiếu CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET hoặc CLOUDINARY_URL).",
        "cloudinary_not_configured",
        503
      );
    }
    try {
      const result = await cloudinary.uploader.upload(remoteUrl, uploadOptions(folder));
      return NextResponse.json({
        url: result.secure_url,
        publicId: result.public_id,
        source: "cloudinary",
      });
    } catch (err) {
      const { message, httpCode } = readCloudinaryError(err);
      console.error("[upload] Cloudinary remote upload failed:", { message, httpCode, remoteUrl });
      return fail(`Cloudinary không tải được link này: ${message}`, "cloudinary_error", 502);
    }
  }

  // ─── TRƯỜNG HỢP 2: FILE TỪ MÁY ───
  if (!(file instanceof File)) {
    return fail("Chưa chọn file ảnh.", "missing_input", 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return fail("Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF, SVG).", "invalid_type", 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    return fail("File vượt quá giới hạn 4MB.", "too_large", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!configured) {
    if (IS_PROD) {
      console.error("[upload] Thiếu biến môi trường Cloudinary trên server production.");
      return fail(
        "Server chưa cấu hình Cloudinary (thiếu CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET hoặc CLOUDINARY_URL).",
        "cloudinary_not_configured",
        503
      );
    }
    // Dev: cho phép lưu cục bộ để không bị chặn, nhưng báo rõ để UI cảnh báo.
    console.warn("[upload] Chưa cấu hình Cloudinary → lưu cục bộ (chỉ dev).");
    try {
      const url = await saveLocallyForDev(buffer, file.type);
      return NextResponse.json({
        url,
        source: "local",
        warning: "Chưa cấu hình Cloudinary nên ảnh chỉ lưu cục bộ, sẽ mất khi deploy.",
      });
    } catch (fsErr) {
      console.error("[upload] Ghi file cục bộ thất bại:", fsErr);
      return fail("Không thể lưu ảnh cục bộ.", "local_write_failed", 500);
    }
  }

  try {
    const result = await uploadBuffer(buffer, uploadOptions(folder, file.type));
    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      source: "cloudinary",
    });
  } catch (err) {
    const { message, httpCode } = readCloudinaryError(err);
    console.error("[upload] Cloudinary upload failed:", { message, httpCode });
    const hint =
      httpCode === 401 || httpCode === 403
        ? " (kiểm tra lại cloud name / API key / API secret có cùng một tài khoản không)"
        : "";
    return fail(`Upload lên Cloudinary thất bại: ${message}${hint}`, "cloudinary_error", 502);
  }
}
