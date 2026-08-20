"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const mockQuestions = [
  "So, what are you planning to do this weekend?",
  "What did you eat today?",
  "What is your favorite movie and why?",
  "Where do you want to travel in the future?",
  "What are your hobbies in your free time?",
  "How do you usually spend your holidays?",
  "Who is your best friend and how did you meet?",
  "What kind of music do you like listening to?",
  "Can you describe your dream job?",
  "What was the happiest moment in your life?",
  "Do you prefer reading books or watching movies?",
  "What is the most interesting place you've ever visited?",
  "If you had a million dollars, what would you do?"
];

// Helper to generate a random position
function getRandomPosition() {
  if (typeof window === "undefined") return { top: "50%", left: "50%" };
  // Keep it within 10% to 80% to avoid going off screen
  const top = Math.floor(Math.random() * 70 + 10) + "%";
  const left = Math.floor(Math.random() * 80 + 10) + "%";
  return { top, left };
}

export default function SpeakingGamePage() {
  const [cards, setCards] = useState(
    mockQuestions.map((q, i) => ({
      id: i,
      question: q,
      position: { top: "50%", left: "50%" },
      delay: Math.random() * 5 + "s",
      duration: Math.random() * 10 + 10 + "s",
    }))
  );

  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  // Initialize positions on client to avoid hydration mismatch
  useEffect(() => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        position: getRandomPosition(),
      }))
    );
  }, []);

  const activeCard = cards.find(c => c.id === activeCardId);

  return (
    <div className="relative min-h-[100vh] bg-background overflow-hidden">
      <div className="absolute top-4 left-4 z-50">
        <Link href="/" className="px-4 py-2 rounded-xl border border-border bg-surface/50 text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors backdrop-blur-md">
          ← Trang chủ
        </Link>
      </div>

      {/* Floating Cards Area */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {cards.map((card) => {
          return (
            <div
              key={card.id}
              className={`absolute animate-float-random pointer-events-auto cursor-pointer transition-transform hover:scale-110 ${activeCardId === card.id ? 'opacity-0' : 'opacity-100'}`}
              style={{
                top: card.position.top,
                left: card.position.left,
                animationDelay: card.delay,
                animationDuration: card.duration,
              }}
              onClick={() => {
                setActiveCardId(card.id);
              }}
            >
              <div className="w-16 h-24 sm:w-24 sm:h-32 rounded-xl bg-gradient-to-br from-indigo/40 to-sakura/40 border border-indigo/50 backdrop-blur-md shadow-[0_0_20px_rgba(129,140,248,0.2)] flex items-center justify-center text-4xl hover:shadow-[0_0_30px_rgba(244,114,182,0.4)] transition-all">
                🎴
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Active Card */}
      {activeCardId !== null && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveCardId(null)}></div>
          
          <div className="relative glass-card p-8 max-w-lg w-full mx-4 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl sm:text-2xl font-bold mb-6 text-foreground leading-relaxed">{activeCard.question}</h3>
            
            <button
              onClick={() => setActiveCardId(null)}
              className="mt-6 px-6 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border text-foreground transition-colors"
            >
              Đóng
            </button>

            <button
              onClick={() => setActiveCardId(null)}
              className="absolute top-4 right-4 text-foreground-muted hover:text-foreground text-xl p-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
