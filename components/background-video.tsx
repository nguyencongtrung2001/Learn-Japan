"use client";

import { useBackground } from "./background-provider";

export default function BackgroundVideo() {
  const { videoId, isMuted } = useBackground();

  if (!videoId) return null;

  return (
    <div className="fixed inset-0 w-full h-full z-[-10] overflow-hidden bg-black pointer-events-none select-none">
      <iframe
        className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${videoId}&mute=${isMuted ? 1 : 0}&playsinline=1`}
        allow="autoplay; encrypted-media"
        frameBorder="0"
      />
    </div>
  );
}
