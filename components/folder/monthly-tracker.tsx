"use client";

import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
} from "date-fns";

const STORAGE_KEY = "studyStreak_global";

export function MonthlyTracker() {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    new Set<string>()
  );

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const arr: string[] = JSON.parse(stored);
        setSelectedDates(new Set<string>(arr));
      } catch (_) {}
    }
  }, []);

  const save = (set: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  };

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const toggleDate = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const newSet = new Set<string>(selectedDates);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedDates(newSet);
    save(newSet);
  };

  // Count streak
  const streakCount = selectedDates.size;

  // Build weeks rows
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  for (let i = 0; i < getDay(monthStart); i++) week.push(null);
  days.forEach((d) => {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold gradient-text">{streakCount}</p>
          <p className="text-sm text-foreground-muted mt-1">
            Ngày đã học tháng này
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold gradient-text">
            {days.length - streakCount}
          </p>
          <p className="text-sm text-foreground-muted mt-1">Ngày còn lại</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="card p-5">
        <h2 className="text-lg font-bold mb-4">
          📅 Tháng {format(today, "MMMM yyyy")}
        </h2>
        <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
            <div
              key={d}
              className="font-semibold text-foreground-muted py-1.5"
            >
              {d}
            </div>
          ))}
          {weeks.map((w, wi) =>
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
                    transition-all duration-200 cursor-pointer
                    ${
                      selected
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                        : isToday
                          ? "bg-indigo/20 text-indigo-light ring-2 ring-indigo/40"
                          : "bg-surface hover:bg-surface-hover text-foreground"
                    }
                  `}
                  title={format(d, "PPP")}
                >
                  {d.getDate()}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 justify-center text-sm text-foreground-muted">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
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
