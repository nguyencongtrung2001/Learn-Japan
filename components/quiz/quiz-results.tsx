interface QuizResultsProps {
  correct: number;
  incorrect: number;
  completedWords: number;
  onContinue: () => void;
  onBack: () => void;
}

export function QuizResults({ correct, incorrect, completedWords, onContinue, onBack }: QuizResultsProps) {
  const total = correct + incorrect;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="animate-fade-in-up mx-auto max-w-lg px-4 py-12 text-center">
      <div className="glass-card mb-8 p-8 sm:p-10">
        <div className="mb-4 text-5xl">{accuracy >= 80 ? "🌺" : accuracy >= 50 ? "🌸" : "🌱"}</div>
        <h2 className="mb-2 text-2xl font-bold">
          {completedWords > 0 ? `${completedWords} từ đã nở hoa!` : "Phiên ôn tập hoàn tất!"}
        </h2>
        <p className="mb-6 text-sm text-foreground-muted">
          {accuracy >= 80
            ? "Tuyệt vời! Bạn đã nắm rất vững!"
            : accuracy >= 50
              ? "Khá tốt! Hãy tiếp tục luyện tập!"
              : "Đừng nản, luyện thêm sẽ giỏi hơn!"}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Stat value={correct} label="Đúng" tone="emerald" />
          <Stat value={incorrect} label="Sai" tone="rose" />
          <Stat value={`${accuracy}%`} label="Chính xác" tone="gold" />
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onContinue}
          className="btn-shine cursor-pointer rounded-2xl bg-gradient-to-r from-sakura to-indigo px-8 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-sakura/20"
        >
          🔄 Tiếp tục
        </button>
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-2xl border border-border px-6 py-3 font-medium text-foreground-muted transition-all duration-200 hover:bg-surface-hover hover:text-foreground"
        >
          ← Quay lại
        </button>
      </div>
    </div>
  );
}

const TONES = {
  emerald: { box: "bg-emerald/10 border-emerald/20", value: "text-emerald", label: "text-emerald/60" },
  rose: { box: "bg-rose/10 border-rose/20", value: "text-rose", label: "text-rose/60" },
  gold: { box: "bg-gold/10 border-gold/20", value: "text-gold", label: "text-gold/60" },
} as const;

function Stat({ value, label, tone }: { value: number | string; label: string; tone: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl border px-4 py-2 ${t.box}`}>
      <div className={`text-lg font-bold ${t.value}`}>{value}</div>
      <div className={`text-[10px] uppercase ${t.label}`}>{label}</div>
    </div>
  );
}
