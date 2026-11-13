"use client";

import { useState } from "react";
import { useBackground } from "./background-provider";

const PRESET_VIDEOS = [
  { id: "ytpCMJYkGaE", title: "Frieren Eternity", icon: "🌌" },
  { id: "_kvEuReNgsw", title: "Aquarium Relax", icon: "🐠" },
  { id: "TACv9IIZW2A", title: "Coral Reef 4K", icon: "🌊" },
  { id: "jfKfPfyJRdk", title: "Lofi Hip Hop Study", icon: "☕" },
  { id: "N23EsXcvUwE", title: "Forest River & Birds", icon: "🌿" },
  { id: "SgEQrUIKJ6Y", title: "Aerial Nature Views", icon: "🏞️" },
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
      alert("Link YouTube không hợp lệ! Vui lòng nhập link chuẩn (youtube.com/watch?v=... hoặc youtu.be/...)");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-white border border-[#E2E4E9] shadow-lg
                   hover:scale-110 hover:shadow-xl transition-all duration-200 z-40 text-xl cursor-pointer text-[#1A1D28]"
        title="Đổi hình nền video"
        aria-label="Đổi hình nền video"
      >
        🎬
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#E2E4E9] bg-white p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28] transition-colors"
              title="Đóng"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-[#1A1D28] mb-1 flex items-center gap-2">
              <span>🎬</span> Hình Nền Video YouTube
            </h2>
            <p className="text-xs text-[#586380] mb-4">
              Tạo không gian học tập sống động với video nền chạy mượt mà
            </p>

            {/* Mute toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F7FB] border border-[#E2E4E9] mb-4">
              <div>
                <p className="font-bold text-xs text-[#1A1D28]">Âm thanh video</p>
                <p className="text-[11px] text-[#939BB4]">Tắt tiếng để tập trung học tập</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isMuted
                    ? "bg-[#23B26D] text-white"
                    : "bg-white border border-[#E2E4E9] text-[#586380]"
                }`}
              >
                {!isMuted ? "🔊 Đang bật" : "🔇 Đã tắt tiếng"}
              </button>
            </div>

            {/* Preset List */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-[#586380] uppercase tracking-wider mb-2">
                Video gợi ý
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_VIDEOS.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => {
                      setVideoId(video.id);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      videoId === video.id
                        ? "bg-blue-50 border-[#4255FF] text-[#4255FF] shadow-xs"
                        : "bg-[#F6F7FB] border-[#E2E4E9] text-[#1A1D28] hover:bg-white hover:border-[#4255FF]/40"
                    }`}
                  >
                    <span className="mr-1.5">{video.icon}</span>
                    {video.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-[#586380] uppercase tracking-wider mb-2">
                Hoặc dán link YouTube bất kỳ
              </h3>
              <form onSubmit={handleCustomSubmit} className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E2E4E9] text-xs text-[#1A1D28] outline-none focus:border-[#4255FF]"
                />
                <button
                  type="submit"
                  disabled={!customUrl.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#4255FF] text-white text-xs font-bold hover:bg-[#3344DD] disabled:opacity-50 transition-all cursor-pointer"
                >
                  Áp dụng
                </button>
              </form>
            </div>

            {/* Turn off */}
            {videoId && (
              <button
                type="button"
                onClick={() => {
                  setVideoId(null);
                  setIsOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
              >
                🚫 Tắt hình nền video
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
