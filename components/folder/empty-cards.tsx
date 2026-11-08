interface EmptyCardsProps {
  onAddCard?: () => void;
  onBulkImport?: () => void;
}

export function EmptyCards({ onAddCard, onBulkImport }: EmptyCardsProps = {}) {
  return (
    <div className="glass-card border-2 border-dashed border-border/50 py-16 px-4 text-center">
      <div className="mb-4 text-5xl">📭</div>
      <p className="mb-1 text-lg font-bold text-foreground">Thư mục đang trống</p>
      <p className="mb-6 text-sm text-foreground-muted">
        Bấm &quot;Thêm Thẻ Mới&quot; hoặc &quot;Nhập nhanh&quot; để tạo từ vựng cho thư mục này.
      </p>
      {(onAddCard || onBulkImport) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onAddCard && (
            <button
              type="button"
              onClick={onAddCard}
              className="cursor-pointer rounded-xl bg-indigo/15 border border-indigo/30 px-5 py-2.5 text-sm font-bold text-indigo-light hover:bg-indigo hover:text-white transition-all shadow-sm"
            >
              ＋ Thêm Thẻ Mới
            </button>
          )}
          {onBulkImport && (
            <button
              type="button"
              onClick={onBulkImport}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-sakura/20 to-indigo/20 border border-sakura/30 px-5 py-2.5 text-sm font-bold text-sakura-light hover:border-sakura hover:scale-105 transition-all shadow-sm"
            >
              ⚡ Nhập Nhanh Từ Vựng
            </button>
          )}
        </div>
      )}
    </div>
  );
}
