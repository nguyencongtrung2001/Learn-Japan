import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * Lưu ảnh vào thư mục public/uploads cục bộ, nếu lỗi ổ đĩa thì tự chuyển sang Base64 data URL
 */
async function saveLocally(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = EXT_MAP[mimeType] || "jpg";
    const uniqueName = `img-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    await fs.writeFile(filePath, buffer);
    return `/uploads/${uniqueName}`;
  } catch (fsErr) {
    console.warn("Ghi file cục bộ thất bại, chuyển sang Base64:", fsErr);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "english";

    if (!file) {
      return NextResponse.json({ error: "Chưa chọn file ảnh." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF, SVG)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File vượt quá giới hạn 5MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    // 1. Thử upload lên Cloudinary nếu có cấu hình đầy đủ
    if (cloudName && apiKey && apiSecret) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });

        const folder = language === "japanese" ? "Image/Japan" : "Image/English";
        const b64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        const uploadResult = await cloudinary.uploader.upload(b64, {
          folder,
          resource_type: "image",
        });

        if (uploadResult?.secure_url) {
          return NextResponse.json({ url: uploadResult.secure_url });
        }
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, falling back to local storage:", cloudErr);
      }
    }

    // 2. Tự động lưu cục bộ (hoặc Base64) nếu Cloudinary chưa sẵn sàng
    const localUrl = await saveLocally(buffer, file.type);
    return NextResponse.json({
      url: localUrl,
      source: "local",
    });
  } catch (err) {
    console.error("Upload API error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Lỗi server khi upload ảnh: ${detail}` }, { status: 500 });
  }
}
