"use client";

import { useState } from "react";
import { useBackground } from "./background-provider";
import { useTheme, THEME_LIST } from "./theme-provider";

export interface BackgroundVideoItem {
  id: string;
  title: string;
  icon?: string;
}

const DEFAULT_VIDEOS: BackgroundVideoItem[] = [
  { id: "ytpCMJYkGaE", title: "Frieren Eternity", icon: "🖼️" },
  { id: "_kvEuReNgsw", title: "Aquarium Cat TV", icon: "🐠" },
  { id: "TACv9IIZW2A", title: "Aquarium Coral Reef", icon: "🌊" },
  { id: "SgEQrUIKJ6Y", title: "Aerial Nature Views", icon: "🏞️" },
  { id: "IfJBp3NZCjc", title: "Wild Animals 4K", icon: "🦁" },
  { id: "N23EsXcvUwE", title: "Forest River & Birds", icon: "🌿" },
];

const STORAGE_KEY = "customBackgroundVideos_v1";

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Matching standard watch, youtu.be, embed, shorts, v, etc.
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export default function BackgroundSelector() {
  const { videoId, setVideoId, isMuted, setIsMuted } = useBackground();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"theme" | "video">("theme");
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [videos, setVideos] = useState<BackgroundVideoItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_VIDEOS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_VIDEOS;
  });

  const saveVideos = (list: BackgroundVideoItem[]) => {
    setVideos(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const id = extractVideoId(customUrl);

    if (!id) {
      setErrorMsg("Link YouTube không hợp lệ! Vui lòng kiểm tra lại URL hoặc ID video.");
      return;
    }

    const title = customTitle.trim() || `YouTube Video (${id.slice(0, 6)}...)`;

    // Check if already in list
    const existingIndex = videos.findIndex((v) => v.id === id);
    if (existingIndex !== -1) {
      setVideoId(id);
      setCustomUrl("");
      setCustomTitle("");
      return;
    }

    const newItem: BackgroundVideoItem = {
      id,
      title,
      icon: "🎬",
    };

    const nextList = [newItem, ...videos];
    saveVideos(nextList);
    setVideoId(id);
    setCustomUrl("");
    setCustomTitle("");
  };

  const handleDeleteVideo = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextList = videos.filter((v) => v.id !== idToDelete);
    saveVideos(nextList);

    if (videoId === idToDelete) {
      setVideoId(nextList.length > 0 ? nextList[0].id : null);
    }
  };

  const handleResetDefaults = () => {
    saveVideos(DEFAULT_VIDEOS);
  };

  const currentThemeObj = THEME_LIST.find((t) => t.id === theme) || THEME_LIST[0];

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3.5 rounded-full bg-surface/90 border border-border shadow-xl backdrop-blur-md
                   hover:scale-110 transition-all duration-300 z-40 text-xl cursor-pointer"
        title="Tùy chỉnh màu sắc & hình nền"
        aria-label="Tùy chỉnh màu sắc & hình nền"
      >
        🎨
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-lg max-h-[90vh] flex flex-col p-5 sm:p-6 relative shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50">
              <h2 className="text-lg sm:text-xl font-black gradient-text flex items-center gap-2">
                <span>✨</span>
                <span>Tùy Chỉnh Giao Diện & Hình Nền</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                title="Đóng"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-4 bg-surface/80 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setActiveTab("theme")}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "theme"
                    ? "bg-indigo text-white shadow-md shadow-indigo/25"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <span>🎨</span>
                <span>Màu Sắc Giao Diện</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "video"
                    ? "bg-indigo text-white shadow-md shadow-indigo/25"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <span>🎬</span>
                <span>Hình Nền Video</span>
                {videoId && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                )}
              </button>
            </div>

            {/* Tab 1: Màu sắc giao diện */}
            {activeTab === "theme" && (
              <div className="overflow-y-auto space-y-4 pr-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
                      Chọn bảng màu chủ đề
                    </h3>
                    <span className="text-xs font-bold text-indigo-light">
                      {currentThemeObj.icon} {currentThemeObj.name}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-dim mb-3">
                    Thay đổi phong cách màu sắc cho toàn bộ ứng dụng (thẻ, nút, chữ, hiệu ứng neon).
                  </p>

                  {/* Grid of themes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {THEME_LIST.map((t) => {
                      const isCurrent = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTheme(t.id)}
                          className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer group ${
                            isCurrent
                              ? "border-indigo bg-indigo/15 ring-2 ring-indigo/40 shadow-lg shadow-indigo/10 scale-[1.02]"
                              : "border-border/60 bg-surface/70 hover:border-indigo/50 hover:bg-surface-hover"
                          }`}
                        >
                          {/* Color Swatch Dots */}
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0"
                              style={{ backgroundColor: t.bgHex }}
                              title="Màu nền"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0"
                              style={{ backgroundColor: t.surfaceHex }}
                              title="Màu thẻ"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0"
                              style={{ backgroundColor: t.accentHex }}
                              title="Màu điểm nhấn"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-xs shrink-0 ml-auto"
                              style={{ backgroundColor: t.secondaryHex }}
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{t.icon}</span>
                            <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                              {t.name}
                            </span>
                          </div>

                          <p className="text-[11px] text-foreground-dim mt-0.5 truncate">
                            {t.description}
                          </p>

                          {isCurrent && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-emerald">
                              <span>✓</span>
                              <span>Đang áp dụng</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="rounded-2xl border border-indigo/30 bg-surface/90 p-4 shadow-sm">
                  <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>👁️</span>
                    <span>Xem trước phong cách ({currentThemeObj.name})</span>
                  </p>

                  <div className="rounded-xl border border-border/80 bg-surface-hover/80 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black gradient-text">
                        Every Word Matters
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Từ vựng thông dụng • C1
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo text-white shadow-sm shadow-indigo/25">
                        Học ngay
                      </span>
                      <span className="px-2 py-1 rounded-lg text-xs font-bold border border-border text-foreground-muted">
                        Ôn tập
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Hình nền Video */}
            {activeTab === "video" && (
              <div className="overflow-y-auto space-y-4 pr-1">
                {/* Mute audio toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/80 border border-border/40">
                  <div>
                    <p className="font-semibold text-xs sm:text-sm">Âm thanh video</p>
                    <p className="text-[11px] text-foreground-dim">Trình duyệt có thể chặn tự động phát nếu bật âm thanh</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isMuted ? "bg-indigo text-white shadow-sm shadow-indigo/30" : "bg-surface border border-border text-foreground-muted"
                    }`}
                  >
                    {!isMuted ? "🔊 Đang bật" : "🔇 Đã tắt"}
                  </button>
                </div>

                {/* Form: Thêm link YouTube mới */}
                <div className="rounded-2xl border border-indigo/25 bg-indigo/5 p-3.5 sm:p-4">
                  <h3 className="text-xs font-bold text-indigo-light uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>➕</span>
                    <span>Thêm link YouTube mới</span>
                  </h3>
                  <form onSubmit={handleAddVideo} className="space-y-2">
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => {
                        setCustomUrl(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Dán link YouTube (watch, youtu.be, shorts...)"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs sm:text-sm outline-none focus:border-indigo transition-all placeholder:text-foreground-muted/40"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Tên video (tùy chọn)..."
                        className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-xs outline-none focus:border-indigo transition-all placeholder:text-foreground-muted/40"
                      />
                      <button
                        type="submit"
                        disabled={!customUrl.trim()}
                        className="px-4 py-2 rounded-xl bg-indigo text-white text-xs font-bold shadow-md hover:bg-indigo-light active:scale-95 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                      >
                        ➕ Thêm & Đổi
                      </button>
                    </div>
                    {errorMsg && (
                      <p className="text-xs text-rose font-medium mt-1">{errorMsg}</p>
                    )}
                  </form>
                </div>

                {/* Danh sách video đã lưu */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      Danh sách video ({videos.length})
                    </h3>
                    {videos.length !== DEFAULT_VIDEOS.length && (
                      <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="text-[11px] text-foreground-muted hover:text-indigo-light transition-colors cursor-pointer"
                      >
                        Khôi phục gợi ý gốc
                      </button>
                    )}
                  </div>

                  {videos.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-border/60 rounded-xl text-xs text-foreground-muted">
                      <p>Chưa có video nào trong danh sách.</p>
                      <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="mt-2 text-indigo-light font-semibold hover:underline"
                      >
                        Khôi phục danh sách gợi ý
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {videos.map((video) => {
                        const isActive = videoId === video.id;
                        return (
                          <div
                            key={video.id}
                            onClick={() => {
                              setVideoId(video.id);
                            }}
                            className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isActive
                                ? "bg-indigo/15 border-indigo text-indigo-light shadow-sm"
                                : "bg-surface border-border/60 text-foreground hover:border-indigo/40 hover:bg-surface-hover"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <div className="relative w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-black/50 border border-border/40">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                                  {video.icon && <span className="mr-1">{video.icon}</span>}
                                  {video.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-foreground-muted font-mono truncate">
                                    ID: {video.id}
                                  </span>
                                  {isActive && (
                                    <span className="text-[9px] font-bold text-emerald bg-emerald/15 px-1.5 py-0.2 rounded border border-emerald/30">
                                      Đang phát
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteVideo(video.id, e)}
                              className="p-1.5 rounded-lg text-foreground-muted hover:text-rose hover:bg-rose/10 transition-colors cursor-pointer shrink-0"
                              title="Xóa khỏi danh sách"
                              aria-label={`Xóa video ${video.title}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Bottom */}
            <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between gap-2">
              {videoId ? (
                <button
                  type="button"
                  onClick={() => {
                    setVideoId(null);
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose/30 text-rose text-xs sm:text-sm font-semibold hover:bg-rose/10 transition-colors cursor-pointer"
                >
                  🚫 Tắt hình nền video
                </button>
              ) : (
                <p className="text-xs text-foreground-muted italic text-center w-full">
                  💡 Bạn có thể chọn màu giao diện kết hợp cùng video nền.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
