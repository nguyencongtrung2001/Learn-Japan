"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, useCallback } from "react";

export type ThemeId = "dark" | "violet" | "emerald" | "ocean" | "sunset" | "light";

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
  icon: string;
  bgHex: string;
  surfaceHex: string;
  accentHex: string;
  secondaryHex: string;
}

export const THEME_LIST: ThemeInfo[] = [
  {
    id: "dark",
    name: "Dạ Lam",
    description: "Xanh đêm cổ điển",
    icon: "🌌",
    bgHex: "#0c0f1a",
    surfaceHex: "#1a1f35",
    accentHex: "#818cf8",
    secondaryHex: "#f472b6",
  },
  {
    id: "violet",
    name: "Tím Huyền Ảo",
    description: "Tím neon hiện đại",
    icon: "🔮",
    bgHex: "#0d0722",
    surfaceHex: "#1e104a",
    accentHex: "#a855f7",
    secondaryHex: "#ec4899",
  },
  {
    id: "emerald",
    name: "Thần Rừng",
    description: "Xanh ngọc huyền bí",
    icon: "🌿",
    bgHex: "#04140f",
    surfaceHex: "#0f3327",
    accentHex: "#10b981",
    secondaryHex: "#34d399",
  },
  {
    id: "ocean",
    name: "Đại Dương",
    description: "Xanh biển sâu sapphire",
    icon: "🌊",
    bgHex: "#040e21",
    surfaceHex: "#0d2757",
    accentHex: "#0ea5e9",
    secondaryHex: "#38bdf8",
  },
  {
    id: "sunset",
    name: "Hoàng Hôn",
    description: "Đỏ hồng & hổ phách",
    icon: "🌇",
    bgHex: "#190a12",
    surfaceHex: "#38182b",
    accentHex: "#f43f5e",
    secondaryHex: "#fbbf24",
  },
  {
    id: "light",
    name: "Sáng Tinh Khôi",
    description: "Trắng sáng thanh lịch",
    icon: "☀️",
    bgHex: "#f8f6f3",
    surfaceHex: "#ffffff",
    accentHex: "#6366f1",
    secondaryHex: "#db2777",
  },
];

const THEME_EVENT = "app-theme-change";

function subscribeTheme(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): ThemeId {
  try {
    const saved = localStorage.getItem("theme") as ThemeId | null;
    if (saved && THEME_LIST.some((t) => t.id === saved)) {
      return saved;
    }
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch {
    // ignore
  }
  return "dark";
}

function getServerThemeSnapshot(): ThemeId {
  return "dark";
}

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const applyTheme = useCallback((next: ThemeId) => {
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }

    if (next === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
    }

    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: ThemeId = theme === "light" ? "dark" : "light";
    applyTheme(next);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
