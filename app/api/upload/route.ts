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
    const remoteUrl = (formData.get("url") as string | null)?.trim();
    const language = (formData.get("language") as string) || "english";

    if (!file && !remoteUrl) {
      return NextResponse.json({ error: "Chưa cung cấp file ảnh hoặc link URL." }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    const folder = language === "japanese" ? "Home/Japan" : "Home/English";

    // ─── TRƯỜNG HỢP 1: DÁN LINK URL TỪ NGOÀI ───
    if (remoteUrl) {
      // 1. Thử đưa thẳng URL lên Cloudinary để lưu trữ vĩnh viễn
      if (cloudName && apiKey && apiSecret) {
        try {
          cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
          });

          const uploadResult = await cloudinary.uploader.upload(remoteUrl, {
            folder,
            resource_type: "image",
          });

          if (uploadResult?.secure_url) {
            return NextResponse.json({ url: uploadResult.secure_url, source: "cloudinary" });
          }
        } catch (cloudErr) {
          console.warn("Cloudinary remote URL upload failed, trying local clone:", cloudErr);
        }
      }

      // 2. Dự phòng: Tải ảnh từ URL về lưu cục bộ để tránh link chết
      try {
        const fetchRes = await fetch(remoteUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        if (fetchRes.ok) {
          const contentType = fetchRes.headers.get("content-type") || "image/jpeg";
          const mimeType = contentType.split(";")[0].trim();
          const arrayBuf = await fetchRes.arrayBuffer();
          const localUrl = await saveLocally(Buffer.from(arrayBuf), mimeType);
          return NextResponse.json({ url: localUrl, source: "local" });
        }
      } catch (fetchErr) {
        console.warn("Fetch remote URL failed, using raw link:", fetchErr);
      }

      // 3. Fallback cuối cùng: giữ nguyên link người dùng nhập
      return NextResponse.json({ url: remoteUrl, source: "raw" });
    }

    // ─── TRƯỜNG HỢP 2: TẢI FILE ẢNH TỪ MÁY ───
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

    // 1. Thử upload lên Cloudinary nếu có cấu hình đầy đủ
    if (cloudName && apiKey && apiSecret) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });

        const b64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        const uploadResult = await cloudinary.uploader.upload(b64, {
          folder,
          resource_type: "image",
        });

        if (uploadResult?.secure_url) {
          return NextResponse.json({ url: uploadResult.secure_url, source: "cloudinary" });
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
