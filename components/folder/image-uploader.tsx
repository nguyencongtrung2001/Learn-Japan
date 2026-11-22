"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  language?: string;
  /**
   * Báo cho form cha biết uploader đang bận (đang upload, hoặc đã gõ link
   * nhưng chưa bấm "Gắn link") để form cha chặn nút Lưu → tránh lưu thẻ khi chưa có ảnh.
   */
  onBusyChange?: (busy: boolean) => void;
}

interface UploadResponse {
  url: string;
  source?: "cloudinary" | "local";
  warning?: string;
  error?: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";
const ALLOWED_TYPES = ACCEPT.split(",");

const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024; // ảnh gốc tối đa 15MB (sẽ được nén)
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // giới hạn thực tế gửi lên server (Vercel ~4.5MB)
const MAX_DIMENSION = 1600;
const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024;

/** Thu nhỏ + nén ảnh lớn về JPEG trước khi upload. GIF/SVG giữ nguyên. */
async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // không giải mã được → để server báo lỗi định dạng
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const needsResize = scale < 1;
  const needsConvert = !ALLOWED_TYPES.includes(file.type);

  if (!needsResize && !needsConvert && file.size <= COMPRESS_THRESHOLD) {
    bitmap.close();
    return file;
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.fillStyle = "#ffffff"; // JPEG không có nền trong suốt
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );
  if (!blob || (!needsResize && !needsConvert && blob.size >= file.size)) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

async function postUpload(formData: FormData): Promise<UploadResponse> {
  const res = await fetch("/api/upload", { method: "POST", body: formData });

  let data: Partial<UploadResponse> = {};
  try {
    data = await res.json();
  } catch {
    if (res.status === 413) {
      throw new Error("File quá lớn so với giới hạn của server (4MB).");
    }
    throw new Error(`Server trả về lỗi ${res.status} (phản hồi không phải JSON).`);
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error || `Upload thất bại (HTTP ${res.status}).`);
  }
  return data as UploadResponse;
}

export function ImageUploader({
  value,
  onChange,
  language = "english",
  onBusyChange,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [rawFallback, setRawFallback] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đã gõ link nhưng chưa bấm "Gắn link" → ảnh chưa được lưu lên Cloudinary.
  const urlPending = mode === "url" && !value && urlInput.trim() !== "";
  const busy = uploading || urlPending;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    return () => onBusyChange?.(false);
  }, [onBusyChange]);

  // Giải phóng blob URL của ảnh preview tạm
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Chỉ chấp nhận file ảnh.");
        return;
      }
      if (file.size > MAX_ORIGINAL_BYTES) {
        setError("Ảnh vượt quá 15MB.");
        return;
      }

      setError(null);
      setWarning(null);
      setRawFallback(null);
      setLocalPreview(URL.createObjectURL(file));
      setUploading(true);

      try {
        const prepared = await prepareImage(file);
        if (prepared.size > MAX_UPLOAD_BYTES) {
          throw new Error("Ảnh vẫn lớn hơn 4MB sau khi nén. Hãy chọn ảnh nhỏ hơn.");
        }

        const formData = new FormData();
        formData.append("file", prepared);
        formData.append("language", language);

        const data = await postUpload(formData);
        onChange(data.url);
        setWarning(data.source === "local" ? (data.warning ?? "Ảnh chưa được lưu lên Cloudinary.") : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi upload ảnh.");
      } finally {
        setLocalPreview(null);
        setUploading(false);
      }
    },
    [language, onChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleClear = useCallback(() => {
    onChange("");
    setUrlInput("");
    setLocalPreview(null);
    setError(null);
    setWarning(null);
    setRawFallback(null);
  }, [onChange]);

  const handleApplyUrl = async () => {
    const raw = urlInput.trim();
    if (!raw || uploading) return;

    // Link Cloudinary / link nội bộ đã có sẵn → không cần tải lại
    if (raw.includes("res.cloudinary.com") || raw.startsWith("/uploads/")) {
      onChange(raw);
      setUrlInput("");
      setError(null);
      setRawFallback(null);
      return;
    }

    setUploading(true);
    setError(null);
    setWarning(null);
    setRawFallback(null);

    try {
      const formData = new FormData();
      formData.append("url", raw);
      formData.append("language", language);

      const data = await postUpload(formData);
      onChange(data.url);
      setUrlInput("");
    } catch (err) {
      // KHÔNG âm thầm dùng link gốc nữa: báo lỗi và để người dùng chọn.
      setError(err instanceof Error ? err.message : "Không thể lưu ảnh từ link này lên Cloudinary.");
      setRawFallback(raw);
    } finally {
      setUploading(false);
    }
  };

  const handleUseRawLink = () => {
    if (!rawFallback) return;
    onChange(rawFallback);
    setUrlInput("");
    setRawFallback(null);
    setError(null);
    setWarning("Đang dùng link gốc, ảnh KHÔNG nằm trên Cloudinary nên có thể bị mất nếu nguồn xóa ảnh.");
  };

  const previewUrl = localPreview || value;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[#586380]">
          📸 Hình ảnh minh họa
        </label>
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
              mode === "upload"
                ? "bg-[#4255FF] text-white"
                : "bg-gray-100 text-[#586380] hover:text-[#1A1D28]"
            }`}
          >
            Tải từ máy
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
              mode === "url"
                ? "bg-[#4255FF] text-white"
                : "bg-gray-100 text-[#586380] hover:text-[#1A1D28]"
            }`}
          >
            Dán link URL
          </button>
        </div>
      </div>

      {/* Có ảnh rồi → hiện preview */}
      {previewUrl ? (
        <div className="relative rounded-xl border border-[#E2E4E9] bg-[#F6F7FB] p-2.5 flex items-center gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E2E4E9] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Ảnh minh họa"
              className="h-full w-full object-cover"
              onError={() => {}}
            />
          </div>

          <div className="flex-1 min-w-0 pr-8">
            {uploading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#4255FF]">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang upload lên Cloudinary...
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full bg-[#4255FF] rounded-full animate-pulse" style={{ width: "75%" }} />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <span
                  className={`text-xs font-bold flex items-center gap-1 ${
                    warning ? "text-amber-600" : "text-[#23B26D]"
                  }`}
                >
                  {warning ? "⚠️ Đã gắn ảnh (chưa lên Cloudinary)" : "✅ Đã gắn ảnh minh họa"}
                </span>
                <p className="line-clamp-1 font-mono text-[10px] text-[#939BB4]">{value}</p>
                {warning && (
                  <p className="text-[10px] font-semibold leading-snug text-amber-600">{warning}</p>
                )}
              </div>
            )}
          </div>

          {/* Nút xóa */}
          {!uploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-200 text-[#586380] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer shadow-xs"
              title="Xóa ảnh"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : mode === "upload" ? (
        /* Chưa có ảnh & chế độ Upload → hiện dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-all ${
            dragOver
              ? "border-[#4255FF] bg-[#4255FF]/5 scale-[1.01]"
              : "border-[#E2E4E9] bg-[#F6F7FB]/50 hover:border-[#4255FF]/50 hover:bg-[#4255FF]/5"
          }`}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#4255FF]/10 text-[#4255FF]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-[#1A1D28]">Kéo thả hoặc bấm để chọn ảnh từ máy</span>
            <p className="text-[10px] text-[#939BB4] mt-0.5">
              Tự động nén và tải lên Cloudinary (ảnh tối đa 15MB)
            </p>
          </div>
        </div>
      ) : (
        /* Chế độ nhập link URL */
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter trong input nằm trong <form> sẽ submit cả form (lưu thẻ không có ảnh) → chặn lại.
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
              placeholder="Dán link ảnh (https://...)"
              disabled={uploading}
              className="flex-1 rounded-xl border border-[#E2E4E9] bg-white px-3.5 py-2.5 text-xs text-[#1A1D28] outline-none transition-all placeholder:text-[#939BB4] focus:border-[#4255FF] focus:ring-2 focus:ring-[#4255FF]/10 font-mono disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              disabled={uploading || !urlInput.trim()}
              className="rounded-xl bg-[#4255FF] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3344DD] transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Gắn link</span>
              )}
            </button>
          </div>
          <p className="text-[10px] text-[#586380] flex items-center gap-1">
            <span>🛡️</span> Ảnh từ link ngoài sẽ được sao lưu lên Cloudinary của bạn để không bao giờ bị mất link.
          </p>
          {urlPending && !uploading && (
            <p className="text-[10px] font-semibold text-amber-600">
              ⚠️ Bấm “Gắn link” (hoặc Enter) để lưu ảnh trước khi lưu thẻ.
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500 font-medium bg-red-50 border border-red-200 p-2 rounded-xl">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span className="flex-1 leading-snug">
            {error}
            {rawFallback && (
              <button
                type="button"
                onClick={handleUseRawLink}
                className="ml-2 underline font-semibold text-red-600 hover:text-red-700 cursor-pointer"
              >
                Vẫn dùng link gốc
              </button>
            )}
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-[10px] text-red-400 hover:text-red-600 underline cursor-pointer ml-1"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
