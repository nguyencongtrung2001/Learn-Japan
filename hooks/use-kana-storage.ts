"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "kana_memorized_ids_v1";

// Cache in-memory array to avoid infinite loop with useSyncExternalStore
let cachedSnapshot: string[] = [];
let cachedRaw: string | null = null;

function getSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== cachedRaw) {
      cachedRaw = saved;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          cachedSnapshot = parsed;
          return cachedSnapshot;
        }
      }
      cachedSnapshot = [];
    }
  } catch {
    cachedSnapshot = [];
  }
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: string[] = [];
function getServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("kana-storage-update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("kana-storage-update", callback);
  };
}

export function useKanaStorage() {
  const memorizedList = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const memorizedIds = useMemo(() => new Set(memorizedList), [memorizedList]);

  const toggleMemorized = useCallback((id: string) => {
    try {
      const current = new Set(getSnapshot());
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
      window.dispatchEvent(new Event("kana-storage-update"));
    } catch (e) {
      console.error("Lỗi lưu dữ liệu ghi nhớ Kana:", e);
    }
  }, []);

  const isMemorized = useCallback(
    (id: string) => {
      return memorizedIds.has(id);
    },
    [memorizedIds]
  );

  const resetAllMemorized = useCallback(() => {
    if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ tiến độ đã thuộc?")) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event("kana-storage-update"));
      } catch (e) {
        console.error("Lỗi xóa dữ liệu:", e);
      }
    }
  }, []);

  return {
    memorizedIds,
    toggleMemorized,
    isMemorized,
    resetAllMemorized,
  };
}
