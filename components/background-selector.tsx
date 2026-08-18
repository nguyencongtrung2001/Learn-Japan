"use client";

import { useState } from "react";
import { useBackground } from "./background-provider";

const PRESET_VIDEOS = [
  { id: "ytpCMJYkGaE", title: "Frieren Eternity", icon: "🖼️" },
  { id: "_kvEuReNgsw", title: "Aquarium Cat TV", icon: "🐠" },
  { id: "TACv9IIZW2A", title: "Aquarium Coral Reef", icon: "🌊" },
  { id: "SgEQrUIKJ6Y", title: "Aerial Nature Views", icon: "🏞️" },
  { id: "IfJBp3NZCjc", title: "Wild Animals 4K", icon: "🦁" },
  { id: "N23EsXcvUwE", title: "Forest River & Birds", icon: "🌿" },
];

export default function BackgroundSelector() {
  const { videoId, setVideoId, isMuted, setIsMuted } = useBackground();
  const [isOpen, setIsOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(customUrl);
    if (id) {
      setVideoId(id);
      setCustomUrl("");
      setIsOpen(false);
    } else {
      alert("Link YouTube không hợp lệ!");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-surface border border-border shadow-lg
                   hover:scale-110 transition-all duration-300 z-40 text-xl"
        title="Đổi hình nền"
      >
        🖼️
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-hover text-foreground-muted transition-colors"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold gradient-text mb-4">🖼️ Hình nền Video</h2>

            {/* Mute toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-hover mb-4">
              <div>
                <p className="font-semibold text-sm">Âm thanh video</p>
                <p className="text-xs text-foreground-dim">Trình duyệt có thể chặn tự động phát nếu bật</p>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  !isMuted ? "bg-indigo text-white" : "bg-surface border border-border text-foreground-muted"
                }`}
              >
                {!isMuted ? "🔊 Bật" : "🔇 Tắt"}
              </button>
            </div>

            {/* Preset List */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                Gợi ý
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_VIDEOS.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setVideoId(video.id);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left text-sm transition-all ${
                      videoId === video.id
                        ? "bg-indigo/10 border-indigo text-indigo-light"
                        : "bg-surface border-border text-foreground hover:border-indigo/50 hover:bg-surface-hover"
                    }`}
                  >
                    <span className="mr-2">{video.icon}</span>
                    {video.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                Hoặc dán Link YouTube
              </h3>
              <form onSubmit={handleCustomSubmit} className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-indigo"
                />
                <button
                  type="submit"
                  disabled={!customUrl.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo text-white text-sm font-semibold disabled:opacity-50"
                >
                  Áp dụng
                </button>
              </form>
            </div>

            {/* Turn off */}
            {videoId && (
              <button
                onClick={() => {
                  setVideoId(null);
                  setIsOpen(false);
                }}
                className="w-full py-3 rounded-xl border border-rose/30 text-rose font-medium hover:bg-rose/10 transition-colors"
              >
                🚫 Tắt hình nền
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
