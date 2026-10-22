import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";

interface MonthlyTrackerProps {
  folderId: number;
}

export function MonthlyTracker({ folderId }: MonthlyTrackerProps) {
  const storageKey = `studyStreak_${folderId}`;
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const arr: string[] = JSON.parse(stored);
        setSelectedDates(new Set(arr));
      } catch (_) {}
    }
  }, [storageKey]);

  const save = (set: Set<string>) => {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
  };

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const toggleDate = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const newSet = new Set(selectedDates);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedDates(newSet);
    save(newSet);
  };

  // Build weeks rows
  const weeks: Date[][] = [];
  let week: Date[] = [];
  // Pad first week with nulls for days before month start
  for (let i = 0; i < getDay(monthStart); i++) week.push(null as any);
  days.forEach((d) => {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) {
    // Pad end of last week
    while (week.length < 7) week.push(null as any);
    weeks.push(week);
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-2">📅 Theo dõi học tháng {format(today, "MMMM yyyy")}</h2>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="font-medium text-foreground-muted">{d}</div>
        ))}
        {weeks.map((w, wi) =>
          w.map((d, di) => {
            if (!d) return <div key={`empty-${wi}-${di}`} />;
            const key = format(d, "yyyy-MM-dd");
            const isToday = isSameDay(d, today);
            const selected = selectedDates.has(key);
            const bg = selected ? "bg-emerald-500" : isToday ? "bg-amber-200" : "bg-surface";
            const text = selected ? "text-white" : "text-foreground";
            return (
              <button
                key={key}
                onClick={() => toggleDate(d)}
                className={`p-2 rounded ${bg} ${text} hover:opacity-80 transition-colors`}
                title={format(d, "PPP")}
              >
                {d.getDate()}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
