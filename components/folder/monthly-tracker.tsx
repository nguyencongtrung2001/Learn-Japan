"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";

const STORAGE_KEY = "studyStreak_global";

export function MonthlyTracker() {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const arr: string[] = JSON.parse(stored);
        return new Set<string>(arr);
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  });
  const [viewMonthDate, setViewMonthDate] = useState<Date>(() => new Date());

  const save = (set: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  };

  const today = new Date();

  // Formula: Ngày còn lại = ngày cuối tháng - ngày hiện tại
  const monthEnd = endOfMonth(today);
  const lastDayOfMonth = monthEnd.getDate();
  const currentDay = today.getDate();
  const remainingDays = Math.max(0, lastDayOfMonth - currentDay);

  const toggleDate = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const newSet = new Set<string>(selectedDates);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedDates(newSet);
    save(newSet);
  };

  // Streak calculations
  const currentMonthPrefix = format(today, "yyyy-MM");
  const monthStreakCount = Array.from(selectedDates).filter((k) =>
    k.startsWith(currentMonthPrefix)
  ).length;
  const totalStreakCount = selectedDates.size;

  // Month calendar calculation (Monday to Sunday)
  const viewMonthStart = startOfMonth(viewMonthDate);
  const viewMonthEnd = endOfMonth(viewMonthDate);
  const monthDays = eachDayOfInterval({
    start: viewMonthStart,
    end: viewMonthEnd,
  });

  const monthWeeks: (Date | null)[][] = [];
  let currentMonthWeek: (Date | null)[] = [];
  // (getDay(viewMonthStart) + 6) % 7 -> empty leading cells before Monday
  const leadingEmpty = (getDay(viewMonthStart) + 6) % 7;
  for (let i = 0; i < leadingEmpty; i++) {
    currentMonthWeek.push(null);
  }
  monthDays.forEach((d) => {
    currentMonthWeek.push(d);
    if (currentMonthWeek.length === 7) {
      monthWeeks.push(currentMonthWeek);
      currentMonthWeek = [];
    }
  });
  if (currentMonthWeek.length > 0) {
    while (currentMonthWeek.length < 7) {
      currentMonthWeek.push(null);
    }
    monthWeeks.push(currentMonthWeek);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      {/* ─── Cột bên trái: Theo dõi học tập & Thống kê ─── */}
      <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text flex items-center gap-2">
            <span>📅</span>
            <span>Theo dõi học tập</span>
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1.5">
            Ghi nhận tiến độ học và duy trì chuỗi ngày rèn luyện.
          </p>
        </div>

        {/* 2 thẻ thống kê: Ngày đã học & Ngày còn lại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
          <div className="card p-5 text-center transition-all hover:border-emerald/40 hover:shadow-lg hover:shadow-emerald/5">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald">{monthStreakCount}</p>
            <p className="text-sm font-bold text-foreground mt-1">
              Ngày đã học tháng này
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">
              Tổng cộng: {totalStreakCount} ngày
            </p>
          </div>

          <div className="card p-5 text-center relative overflow-hidden transition-all hover:border-indigo/40 hover:shadow-lg hover:shadow-indigo/5">
            <p className="text-3xl sm:text-4xl font-extrabold gradient-text">{remainingDays}</p>
            <p className="text-sm font-bold text-foreground mt-1">Ngày còn lại</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              Cuối tháng ({lastDayOfMonth}) - Hiện tại ({currentDay})
            </p>
          </div>
        </div>

        {/* Chú thích màu sắc (Legend) */}
        <div className="card p-4">
          <p className="text-xs font-bold text-foreground-muted mb-3 uppercase tracking-wider">
            Chú thích lịch
          </p>
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/40 shrink-0" />
              <span className="font-medium text-foreground">Đã học (điểm danh ngày)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-md bg-indigo/20 ring-2 ring-indigo/40 shrink-0" />
              <span className="font-medium text-foreground">Hôm nay</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-md bg-surface border border-border shrink-0" />
              <span className="font-medium text-foreground-muted">Chưa học</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Cột bên phải: Lịch tháng ─── */}
      <div className="flex-1 w-full">
        <div className="card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <span>🗓️</span>
              <span>Tháng {format(viewMonthDate, "MM/yyyy")}</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMonthDate((prev) => subMonths(prev, 1))}
                className="p-1.5 rounded-lg hover:bg-surface-hover border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                title="Tháng trước"
                aria-label="Tháng trước"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMonthDate(new Date())}
                className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-surface-hover border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                title="Về tháng hiện tại"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setViewMonthDate((prev) => addMonths(prev, 1))}
                className="p-1.5 rounded-lg hover:bg-surface-hover border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                title="Tháng sau"
                aria-label="Tháng sau"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-sm">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
              <div
                key={d}
                className="font-semibold text-foreground-muted py-1.5 text-xs sm:text-sm"
              >
                {d}
              </div>
            ))}
            {monthWeeks.map((w, wi) =>
              w.map((d, di) => {
                if (!d)
                  return (
                    <div
                      key={`empty-${wi}-${di}`}
                      className="aspect-square"
                    />
                  );
                const key = format(d, "yyyy-MM-dd");
                const isToday = isSameDay(d, today);
                const selected = selectedDates.has(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDate(d)}
                    className={`
                      aspect-square flex items-center justify-center rounded-xl text-sm sm:text-base font-semibold
                      transition-all duration-200 cursor-pointer select-none relative
                      ${
                        selected
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                          : isToday
                            ? "bg-indigo/20 text-indigo-light ring-2 ring-indigo/40"
                            : "bg-surface/80 hover:bg-surface-hover text-foreground border border-border/40"
                      }
                    `}
                    title={`${format(d, "dd/MM/yyyy")}: ${
                      selected ? "Đã học (Bấm để hủy)" : "Chưa học (Bấm để đánh dấu)"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
