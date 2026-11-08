"use client";

import { useEffect, useState, useRef } from "react";

interface QuizTimerBarProps {
  /** Thời gian tối đa (giây): 20s cho viết, 8s cho trắc nghiệm */
  totalSeconds: number;
  /** Đóng băng đồng hồ khi người dùng đã trả lời */
  isPaused: boolean;
  /** Callback gọi khi hết giờ */
  onTimeout: () => void;
  /** Cờ báo hiệu câu này đã bị tính là hết giờ */
  isTimedOut?: boolean;
}

export function QuizTimerBar({
  totalSeconds,
  isPaused,
  onTimeout,
  isTimedOut = false,
}: QuizTimerBarProps) {
  const [timeLeftMs, setTimeLeftMs] = useState(totalSeconds * 1000);
  const timeoutFiredRef = useRef(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // Cập nhật mượt mà 20 lần mỗi giây
    const timer = setInterval(() => {
      setTimeLeftMs((prev) => {
        const next = prev - interval;
        if (next <= 0) {
          clearInterval(timer);
          if (!timeoutFiredRef.current) {
            timeoutFiredRef.current = true;
            onTimeout();
          }
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, onTimeout]);

  const percentage = Math.max(0, Math.min(100, (timeLeftMs / (totalSeconds * 1000)) * 100));
  const secondsLeft = Math.ceil(timeLeftMs / 1000);
  const isUrgent = secondsLeft <= (totalSeconds === 20 ? 5 : 2);

  // Lựa chọn màu sắc thanh đếm lùi
  const barColor = isTimedOut
    ? "bg-rose"
    : isUrgent
      ? "bg-rose shadow-[0_0_12px_rgba(244,63,94,0.6)]"
      : percentage <= 50
        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
        : "bg-gradient-to-r from-indigo via-sakura to-emerald";

  return (
    <div className="w-full mb-4">
      {/* Thông tin số giây đếm ngược */}
      <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-0.5">
        <span className="inline-flex items-center gap-1.5 text-foreground-dim uppercase tracking-wider text-[11px]">
          <span>⏱️ Thời hạn:</span>
          <span className="text-foreground font-semibold">{totalSeconds}s</span>
        </span>

        <span
          className={`font-mono text-xs sm:text-sm font-black transition-colors ${
            isTimedOut || secondsLeft === 0
              ? "text-rose animate-bounce"
              : isUrgent
                ? "text-rose animate-pulse"
                : percentage <= 50
                  ? "text-amber-500"
                  : "text-indigo-light"
          }`}
        >
          {isTimedOut || secondsLeft === 0 ? "⏰ Hết giờ!" : `⏱️ ${secondsLeft}s`}
        </span>
      </div>

      {/* Thanh Process lùi lại (Countdown Progress Bar) */}
      <div className="h-2 w-full rounded-full bg-surface-hover/80 overflow-hidden border border-border/50 p-0.5">
        <div
          className={`h-full rounded-full transition-all ease-linear duration-75 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
