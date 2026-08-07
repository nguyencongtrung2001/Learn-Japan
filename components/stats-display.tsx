"use client";

interface StatsDisplayProps {
  correct: number;
  incorrect: number;
  total: number;
}

export default function StatsDisplay({
  correct,
  incorrect,
  total,
}: StatsDisplayProps) {
  const accuracy =
    correct + incorrect > 0
      ? Math.round((correct / (correct + incorrect)) * 100)
      : 0;

  return (
    <div
      className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center"
      id="stats-display"
    >
      {/* Correct */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/10 border border-emerald/20">
        <span className="text-emerald text-lg">✓</span>
        <div>
          <div className="text-emerald font-bold text-lg leading-none">
            {correct}
          </div>
          <div className="text-emerald/60 text-[10px] uppercase tracking-wider">
            Đúng
          </div>
        </div>
      </div>

      {/* Incorrect */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose/10 border border-rose/20">
        <span className="text-rose text-lg">✗</span>
        <div>
          <div className="text-rose font-bold text-lg leading-none">
            {incorrect}
          </div>
          <div className="text-rose/60 text-[10px] uppercase tracking-wider">
            Sai
          </div>
        </div>
      </div>

      {/* Accuracy */}
      {correct + incorrect > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/10 border border-gold/20">
          <span className="text-gold text-lg">⚡</span>
          <div>
            <div className="text-gold font-bold text-lg leading-none">
              {accuracy}%
            </div>
            <div className="text-gold/60 text-[10px] uppercase tracking-wider">
              Chính xác
            </div>
          </div>
        </div>
      )}

      {/* Total remaining */}
      {total > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo/10 border border-indigo/20">
          <span className="text-indigo text-lg">📝</span>
          <div>
            <div className="text-indigo font-bold text-lg leading-none">
              {total}
            </div>
            <div className="text-indigo/60 text-[10px] uppercase tracking-wider">
              Tổng
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
