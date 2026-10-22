"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Phát phát-âm qua /api/tts. Chỉ giữ 1 Audio duy nhất (bấm bài khác thì dừng bài cũ)
 * và dừng khi component unmount. Trả về hàm `play` có identity ổn định
 * → an toàn để truyền xuống component con được React.memo.
 */
export function useAudio(lang = "en-US") {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return useCallback(
    (text: string) => {
      if (!text) return;
      audioRef.current?.pause();
      const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`);
      audioRef.current = audio;
      audio.play().catch(() => {
        /* trình duyệt chặn autoplay / lỗi mạng → bỏ qua */
      });
    },
    [lang]
  );
}
