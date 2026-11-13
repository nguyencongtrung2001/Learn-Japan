"use client";

/**
 * Simplified ThemeProvider — single Quizlet-inspired theme only.
 * Kept as a minimal wrapper so existing imports don't break.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  return {
    theme: "light" as const,
    setTheme: () => {},
    toggleTheme: () => {},
  };
}
