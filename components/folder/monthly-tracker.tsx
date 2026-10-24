"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameWeek,
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
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(() => new Date());
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

  // Week navigation calculation (Monday to Sunday)
  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const isCurrentWeek = isSameWeek(currentWeekDate, today, { weekStartsOn: 1 });

  const weekCompletedCount = weekDays.filter((d) =>
    selectedDates.has(format(d, "yyyy-MM-dd"))
  ).length;
  const weekPercent = Math.round((weekCompletedCount / 7) * 100);

  const handlePrevWeek = () => {
    const prev = subWeeks(currentWeekDate, 1);
    setCurrentWeekDate(prev);
    // Sync month calendar if week is completely in another month
    const prevStart = startOfWeek(prev, { weekStartsOn: 1 });
    if (format(prevStart, "yyyy-MM") !== format(viewMonthDate, "yyyy-MM")) {
      setViewMonthDate(prevStart);
    }
  };

  const handleNextWeek = () => {
    const next = addWeeks(currentWeekDate, 1);
    setCurrentWeekDate(next);
    // Sync month calendar if week is completely in another month
    const nextStart = startOfWeek(next, { weekStartsOn: 1 });
    if (format(nextStart, "yyyy-MM") !== format(viewMonthDate, "yyyy-MM")) {
      setViewMonthDate(nextStart);
    }
  };

  const handleResetToCurrentWeek = () => {
    setCurrentWeekDate(new Date());
    setViewMonthDate(new Date());
  };

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

      {/* Weekly View with 2 Arrow Buttons on Both Sides */}
      <div className="card p-5 space-y-4">
        {/* Navigation Bar: Arrow Left on left, Title in middle, Arrow Right on right */}
        <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
          {/* Button Arrow Left: Tuần trước */}
          <button
            onClick={handlePrevWeek}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-surface hover:bg-surface-hover border border-border text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm cursor-pointer select-none"
            title="Xem tuần trước"
            aria-label="Xem tuần trước"
          >
            <svg
              className="w-4 h-4 text-foreground-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">Tuần trước</span>
          </button>

          {/* Week Info in Center */}
          <div className="text-center px-1">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Tuần: {format(weekStart, "dd/MM")} - {format(weekEnd, "dd/MM/yyyy")}
              </h3>
              {isCurrentWeek ? (
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
                  Tuần này
                </span>
              ) : null}
            </div>
            {!isCurrentWeek && (
              <button
                onClick={handleResetToCurrentWeek}
                className="text-xs text-indigo hover:text-indigo-light underline mt-1 transition-colors cursor-pointer"
              >
                Quay về tuần hiện tại
              </button>
            )}
          </div>

          {/* Button Arrow Right: Tuần sau */}
          <button
            onClick={handleNextWeek}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-surface hover:bg-surface-hover border border-border text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm cursor-pointer select-none"
            title="Xem tuần sau"
            aria-label="Xem tuần sau"
          >
            <span className="hidden sm:inline">Tuần sau</span>
            <svg
              className="w-4 h-4 text-foreground-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* 7 Days of the Week */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {weekDays.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const isToday = isSameDay(d, today);
            const selected = selectedDates.has(key);
            // Day name in VN: T2, T3, T4, T5, T6, T7, CN
            const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
            const dayLabel = dayNames[getDay(d)];

            return (
              <button
                key={key}
                onClick={() => toggleDate(d)}
                className={`
                  flex flex-col items-center justify-between p-1.5 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none
                  ${
                    selected
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/20 scale-[1.02]"
                      : isToday
                        ? "bg-indigo/10 border-indigo text-indigo-light ring-2 ring-indigo/30"
                        : "bg-surface hover:bg-surface-hover border-border text-foreground"
                  }
                `}
                title={`${dayLabel} ${format(d, "dd/MM/yyyy")}: ${
                  selected ? "Đã học" : "Chưa học"
                }`}
              >
                <span className="text-[11px] sm:text-xs font-semibold opacity-75">
                  {dayLabel}
                </span>
                <span className="text-sm sm:text-lg font-bold my-0.5 sm:my-1">
                  {format(d, "d")}
                </span>
                <span
                  className={`text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-md ${
                    selected
                      ? "bg-emerald-500 text-white"
                      : isToday
                        ? "bg-indigo/20 text-indigo font-bold"
                        : "text-foreground-muted"
                  }`}
                >
                  {selected ? "✓" : isToday ? "Nay" : "○"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Weekly Completion Progress */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5 font-medium">
            <span>Tiến độ tuần: {weekCompletedCount}/7 ngày</span>
            <span>{weekPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${weekPercent}%` }}
            />
          </div>
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
              onClick={() => {
                setViewMonthDate(new Date());
                setCurrentWeekDate(new Date());
              }}
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
              const isInCurrentWeek = isSameWeek(d, currentWeekDate, {
                weekStartsOn: 1,
              });

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
                    ${
                      isInCurrentWeek && !selected
                        ? "border-2 border-dashed border-indigo/40"
                        : ""
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
          <span className="w-3 h-3 rounded border-2 border-dashed border-indigo/50 inline-block" />
          Tuần đang xem
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-surface inline-block border border-border" />
          Chưa học
        </span>
      </div>
    </div>
  );
}
