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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold gradient-text">{monthStreakCount}</p>
          <p className="text-sm font-medium text-foreground mt-1">
            Ngày đã học tháng này
          </p>
          <p className="text-xs text-foreground-muted mt-0.5">
            Tổng cộng: {totalStreakCount} ngày
          </p>
        </div>

        <div className="card p-5 text-center relative overflow-hidden">
          <p className="text-3xl font-bold gradient-text">{remainingDays}</p>
          <p className="text-sm font-medium text-foreground mt-1">Ngày còn lại</p>
          <p className="text-xs text-foreground-muted mt-0.5">
            Cuối tháng ({lastDayOfMonth}) - Hiện tại ({currentDay})
          </p>
        </div>
      </div>

      {/* Monthly Calendar View */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <span>📅</span>
            <span>Tháng {format(viewMonthDate, "MM/yyyy")}</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
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
              onClick={() => setViewMonthDate(new Date())}
              className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-surface-hover border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              title="Về tháng hiện tại"
            >
              Hôm nay
            </button>
            <button
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

        <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
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
                  onClick={() => toggleDate(d)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                    transition-all duration-200 cursor-pointer select-none relative
                    ${
                      selected
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                        : isToday
                          ? "bg-indigo/20 text-indigo-light ring-2 ring-indigo/40"
                          : "bg-surface hover:bg-surface-hover text-foreground"
                    }
                  `}
                  title={`${format(d, "dd/MM/yyyy")}: ${
                    selected ? "Đã học" : "Chưa học"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center text-xs sm:text-sm text-foreground-muted">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block shadow-sm shadow-emerald-500/40" />
          Đã học
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-indigo/20 ring-2 ring-indigo/40 inline-block" />
          Hôm nay
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-surface inline-block border border-border" />
          Chưa học
        </span>
      </div>
    </div>
  );
}
