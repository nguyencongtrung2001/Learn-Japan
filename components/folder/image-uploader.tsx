"use client";

import { useState, useRef, useCallback } from "react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  language?: string;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

export function ImageUploader({ value, onChange, language = "english" }: ImageUploaderProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      // Validate client-side
      if (!file.type.startsWith("image/")) {
        setError("Chỉ chấp nhận file ảnh.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File vượt quá 5MB.");
        return;
      }

      setError(null);
      setLocalPreview(URL.createObjectURL(file));
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.url) {
          throw new Error(data.error || "Upload thất bại.");
        }

        onChange(data.url);
        setUrlInput(data.url);
        setLocalPreview(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi upload ảnh.");
        setLocalPreview(null);
      } finally {
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
  }, [onChange]);

  const handleApplyUrl = () => {
    onChange(urlInput.trim());
    setError(null);
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

          <div className="flex-1 min-w-0">
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
                <span className="text-xs font-bold text-[#23B26D] flex items-center gap-1">
                  ✅ Đã gắn ảnh minh họa
                </span>
                <p className="line-clamp-1 font-mono text-[10px] text-[#939BB4]">{value}</p>
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
            <p className="text-[10px] text-[#939BB4] mt-0.5">Tự động tải lên Cloudinary (Tối đa 5MB)</p>
          </div>
        </div>
      ) : (
        /* Chế độ nhập link URL */
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Dán link ảnh (https://...)"
            className="flex-1 rounded-xl border border-[#E2E4E9] bg-white px-3.5 py-2.5 text-xs text-[#1A1D28] outline-none transition-all placeholder:text-[#939BB4] focus:border-[#4255FF] focus:ring-2 focus:ring-[#4255FF]/10 font-mono"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="rounded-xl bg-[#4255FF] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3344DD] transition-all cursor-pointer shrink-0"
          >
            Gắn link
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500 font-medium bg-red-50 border border-red-200 p-2 rounded-xl">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span className="flex-1 leading-snug">{error}</span>
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
