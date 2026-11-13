interface EmptyCardsProps {
  onAddCard?: () => void;
  onBulkImport?: () => void;
}

export function EmptyCards({ onAddCard, onBulkImport }: EmptyCardsProps = {}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#E2E4E9] bg-white py-16 px-4 text-center">
      <div className="mb-3 text-4xl">📭</div>
      <p className="mb-1 text-base font-bold text-[#1A1D28]">Thư mục đang trống</p>
      <p className="mb-6 text-xs sm:text-sm text-[#586380]">
        Bấm &quot;Thêm Thẻ Mới&quot; hoặc &quot;Nhập từ file Excel&quot; để tạo từ vựng cho thư mục này.
      </p>
      {(onAddCard || onBulkImport) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onAddCard && (
            <button
              type="button"
              onClick={onAddCard}
              className="cursor-pointer rounded-xl bg-white border border-[#E2E4E9] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1A1D28] hover:bg-[#EDEFF4] transition-all shadow-xs"
            >
              ＋ Thêm Thẻ Mới
            </button>
          )}
          {onBulkImport && (
            <button
              type="button"
              onClick={onBulkImport}
              className="cursor-pointer rounded-xl bg-[#4255FF] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#3344DD] transition-all shadow-xs"
            >
              📊 Nhập Từ File Excel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
