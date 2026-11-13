/**
 * Tiện ích phát âm tiếng Nhật tối ưu cho bảng chữ cái Kana
 * Kết hợp Web Speech API (nhanh, mượt, chạy offline) và /api/tts fallback.
 */

class KanaAudioManager {
  private currentAudio: HTMLAudioElement | null = null;

  public play(text: string): void {
    if (!text || typeof window === "undefined") return;

    // Dừng âm thanh cũ nếu đang phát
    this.stop();

    // 1. Thử dùng Web Speech API nếu trình duyệt hỗ trợ (siêu nhanh, không cần mạng)
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        utterance.rate = 0.9; // Tốc độ vừa phải để người mới học dễ nghe

        // Tìm giọng tiếng Nhật tốt nhất nếu có
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
        if (jaVoice) {
          utterance.voice = jaVoice;
        }

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn("SpeechSynthesis error, falling back to TTS API:", err);
      }
    }

    // 2. Fallback dùng /api/tts endpoint của Next.js
    try {
      const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=ja`);
      this.currentAudio = audio;
      audio.play().catch(() => {
        /* Trình duyệt có thể chặn autoplay nếu chưa có tương tác */
      });
    } catch (err) {
      console.warn("Audio playback failed:", err);
    }
  }

  public stop(): void {
    if (typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}

export const kanaAudio = new KanaAudioManager();

export function playKanaAudio(text: string): void {
  kanaAudio.play(text);
}
