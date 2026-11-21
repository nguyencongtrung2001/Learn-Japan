import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

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

    // Determine Cloudinary folder based on language
    const folder = language === "japanese" ? "Image/Japan" : "Image/English";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Create signature for signed upload
    const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    // Build FormData for Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", new Blob([buffer], { type: file.type }), file.name);
    cloudinaryForm.append("api_key", API_KEY);
    cloudinaryForm.append("timestamp", timestamp);
    cloudinaryForm.append("signature", signature);
    cloudinaryForm.append("folder", folder);

    // Upload to Cloudinary
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: cloudinaryForm }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.json().catch(() => ({}));
      console.error("Cloudinary upload error:", errBody);
      return NextResponse.json(
        { error: "Lỗi upload lên Cloudinary. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    const result = await uploadRes.json();
    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: "Lỗi server khi upload ảnh." }, { status: 500 });
  }
}
