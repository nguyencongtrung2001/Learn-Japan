interface CardsHeaderProps {
  count: number;
  onToggleAddCard?: () => void;
  onToggleBulkImport?: () => void;
  showCardForm?: boolean;
  showBulkImport?: boolean;
}

export function CardsHeader({
  count,
  onToggleAddCard,
  onToggleBulkImport,
  showCardForm,
  showBulkImport,
}: CardsHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 className="gradient-text text-xl font-extrabold">🃏 Danh Sách Thẻ</h2>
        <span className="rounded-full border border-border/50 bg-surface px-3 py-1 text-sm font-semibold text-foreground-muted">
          {count} Thẻ
        </span>
      </div>

      {(onToggleAddCard || onToggleBulkImport) && (
        <div className="flex items-center gap-2">
          {onToggleAddCard && (
            <button
              type="button"
              onClick={onToggleAddCard}
              className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                showCardForm
                  ? "bg-indigo text-white shadow-indigo/20 shadow-md"
                  : "bg-indigo/10 border border-indigo/25 text-indigo-light hover:bg-indigo/20"
              }`}
            >
              {showCardForm ? "✕ Đóng Form Thêm" : "＋ Thêm Thẻ"}
            </button>
          )}
          {onToggleBulkImport && (
            <button
              type="button"
              onClick={onToggleBulkImport}
              className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                showBulkImport
                  ? "bg-gradient-to-r from-sakura to-indigo text-white shadow-sakura/20 shadow-md"
                  : "bg-sakura/10 border border-sakura/25 text-sakura-light hover:bg-sakura/20"
              }`}
            >
              {showBulkImport ? "✕ Đóng Nhập Nhanh" : "⚡ Nhập Nhanh"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
