"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to persist state in localStorage
 * Handles SSR safely by deferring reads to useEffect
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Setter that also updates localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch (error) {
          console.warn(`Error writing localStorage key "${key}":`, error);
        }
        return nextValue;
      });
    },
    [key]
  );

  // Clear this key from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Types for progress tracking
export interface LearningProgress {
  correct: number;
  incorrect: number;
  totalAttempts: number;
  lastStudied: string | null;
  masteredKana: string[]; // array of kana characters the user has mastered
}

export const defaultProgress: LearningProgress = {
  correct: 0,
  incorrect: 0,
  totalAttempts: 0,
  lastStudied: null,
  masteredKana: [],
};
