"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface BackgroundContextType {
  videoId: string | null;
  setVideoId: (id: string | null) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [videoId, setVideoIdState] = useState<string | null>(null);
  const [isMuted, setIsMutedState] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    const savedVideoId = localStorage.getItem("backgroundVideoId");
    const savedMuted = localStorage.getItem("backgroundIsMuted");
    
    if (savedVideoId) {
      setVideoIdState(savedVideoId);
    }
    if (savedMuted !== null) {
      setIsMutedState(savedMuted === "true");
    }
    setIsMounted(true);
  }, []);

  const setVideoId = (id: string | null) => {
    setVideoIdState(id);
    if (id) {
      localStorage.setItem("backgroundVideoId", id);
    } else {
      localStorage.removeItem("backgroundVideoId");
    }
  };

  const setIsMuted = (muted: boolean) => {
    setIsMutedState(muted);
    localStorage.setItem("backgroundIsMuted", String(muted));
  };

  if (!isMounted) {
    // Avoid hydration mismatch by not rendering anything that depends on localStorage initially
    return <>{children}</>;
  }

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
