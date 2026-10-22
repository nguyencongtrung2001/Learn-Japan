interface QuizSelectModeProps {
  newCount: number;
  dueCount: number;
  onStartLearn: () => void;
  onStartReview: () => void;
  onBack: () => void;
}

export function QuizSelectMode({ newCount, dueCount, onStartLearn, onStartReview, onBack }: QuizSelectModeProps) {
  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="gradient-text mb-2 text-center text-3xl font-bold">Chọn Chế Độ</h1>
      <p className="mb-10 text-center text-sm text-foreground-muted">Học từ mới hoặc ôn tập từ đã học</p>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={onStartLearn}
          disabled={newCount === 0}
          className={`glass-card group cursor-pointer p-6 text-left transition-all ${
            newCount > 0
              ? "hover:scale-[1.02] hover:border-emerald/30 hover:shadow-lg hover:shadow-emerald/10"
              : "cursor-not-allowed opacity-40"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-4xl">🌱</span>
            {newCount > 0 && (
              <span className="rounded-full bg-emerald/15 px-3 py-1 text-sm font-bold text-emerald">{newCount}</span>
            )}
          </div>
          <h3 className="mb-1 text-lg font-bold transition-colors group-hover:text-emerald">Học từ mới</h3>
          <p className="text-sm text-foreground-muted">
            {newCount > 0
              ? `Gieo hạt ${newCount} từ vựng mới.`
              : "Tất cả từ đã được học! Thêm thẻ mới hoặc ôn tập."}
          </p>
        </button>

        <button
          type="button"
          onClick={onStartReview}
          disabled={dueCount === 0}
          className={`glass-card group cursor-pointer p-6 text-left transition-all ${
            dueCount > 0
              ? "hover:scale-[1.02] hover:border-sakura/30 hover:shadow-lg hover:shadow-sakura/10"
              : "cursor-not-allowed opacity-40"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-4xl">💧</span>
            {dueCount > 0 && (
              <span className="rounded-full bg-sakura/15 px-3 py-1 text-sm font-bold text-sakura-light">{dueCount}</span>
            )}
          </div>
          <h3 className="mb-1 text-lg font-bold transition-colors group-hover:text-sakura-light">Ôn tập</h3>
          <p className="text-sm text-foreground-muted">
            {dueCount > 0
              ? `Tưới nước ${dueCount} bông hoa sắp héo.`
              : "Chưa có từ nào cần ôn tập lúc này!"}
          </p>
        </button>
      </div>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer text-sm text-foreground-muted transition-colors hover:text-indigo-light"
        >
          ← Quay lại thư mục
        </button>
      </div>
    </div>
  );
}
