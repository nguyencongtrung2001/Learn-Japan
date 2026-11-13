"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";

interface BackgroundContextType {
  videoId: string | null;
  setVideoId: (id: string | null) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const BG_EVENT = "app-background-change";

function subscribe(callback: () => void) {
  window.addEventListener(BG_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(BG_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getVideoIdSnapshot(): string | null {
  try {
    return localStorage.getItem("backgroundVideoId");
  } catch {
    return null;
  }
}

function getMutedSnapshot(): boolean {
  try {
    return localStorage.getItem("backgroundIsMuted") !== "false";
  } catch {
    return true;
  }
}

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const videoId = useSyncExternalStore(subscribe, getVideoIdSnapshot, () => null);
  const isMuted = useSyncExternalStore(subscribe, getMutedSnapshot, () => true);

  const setVideoId = (id: string | null) => {
    try {
      if (id) {
        localStorage.setItem("backgroundVideoId", id);
      } else {
        localStorage.removeItem("backgroundVideoId");
      }
      window.dispatchEvent(new Event(BG_EVENT));
    } catch {
      // ignore
    }
  };

  const setIsMuted = (muted: boolean) => {
    try {
      localStorage.setItem("backgroundIsMuted", String(muted));
      window.dispatchEvent(new Event(BG_EVENT));
    } catch {
      // ignore
    }
  };

  return (
    <BackgroundContext.Provider value={{ videoId, setVideoId, isMuted, setIsMuted }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    return { videoId: null, setVideoId: () => {}, isMuted: true, setIsMuted: () => {} };
  }
  return context;
}
