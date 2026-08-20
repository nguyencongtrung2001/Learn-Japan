"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Helper to generate a random position
function getRandomPosition() {
  if (typeof window === "undefined") return { top: "50%", left: "50%" };
  // Keep it within 10% to 80% to avoid going off screen
  const top = Math.floor(Math.random() * 70 + 10) + "%";
  const left = Math.floor(Math.random() * 80 + 10) + "%";
  return { top, left };
}

type CardType = {
  id: number;
  question: string;
  position: { top: string; left: string };
  delay: string;
  duration: string;
};

export default function SpeakingGamePage() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  
  // States for inputting questions
  const [showInput, setShowInput] = useState(true);
  const [inputText, setInputText] = useState("");

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("speaking_game_questions");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setInputText(parsed.join("\n"));
        generateCards(parsed);
      }
    }
  }, []);

  const generateCards = (questions: string[]) => {
    const newCards = questions
      .filter((q) => q.trim() !== "")
      .map((q, i) => ({
        id: i,
        question: q.trim(),
        position: getRandomPosition(),
        delay: Math.random() * 5 + "s",
        duration: Math.random() * 10 + 10 + "s",
      }));
    setCards(newCards);
    setShowInput(false);
  };

  const handleStart = () => {
    const questionsList = inputText.split("\n").filter(q => q.trim() !== "");
    if (questionsList.length === 0) {
      alert("Vui lòng nhập ít nhất 1 câu hỏi!");
      return;
    }
    localStorage.setItem("speaking_game_questions", JSON.stringify(questionsList));
    generateCards(questionsList);
  };

  const activeCard = cards.find((c) => c.id === activeCardId);

  return (
    <div className="relative min-h-[100vh] bg-background overflow-hidden">
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Link
          href="/"
          className="px-4 py-2 rounded-xl border border-border bg-surface/50 text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors backdrop-blur-md"
        >
          ← Trang chủ
        </Link>
        {!showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="px-4 py-2 rounded-xl border border-border bg-surface/50 text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors backdrop-blur-md"
          >
            ✏️ Sửa danh sách
          </button>
        )}
      </div>

      {showInput ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 max-w-2xl w-full animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-2 gradient-text">Nhập danh sách câu hỏi</h2>
            <p className="text-foreground-muted text-sm mb-4">Mỗi dòng tương ứng với 1 lá bài.</p>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="So, what are you planning to do this weekend?&#10;What did you eat today?"
              className="w-full h-64 bg-background/50 border border-border rounded-xl p-4 text-foreground placeholder-foreground-dim mb-4 focus:outline-none focus:border-indigo transition-colors"
            />
            
            <button
              onClick={handleStart}
              className="w-full btn-shine px-6 py-3 rounded-xl bg-gradient-to-r from-indigo to-sakura text-white font-bold text-lg hover:shadow-[0_0_20px_rgba(129,140,248,0.4)] transition-all"
            >
              🚀 Bắt đầu thả bài
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Floating Cards Area */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {cards.map((card) => {
              return (
                <div
                  key={card.id}
                  className={`absolute animate-float-random pointer-events-auto cursor-pointer transition-transform hover:scale-110 ${
                    activeCardId === card.id ? "opacity-0" : "opacity-100"
                  }`}
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
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={() => setActiveCardId(null)}
              ></div>

              <div className="relative glass-card p-8 max-w-lg w-full mx-4 text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-foreground leading-relaxed">
                  {activeCard.question}
                </h3>

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
        </>
      )}
    </div>
  );
}
