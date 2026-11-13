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
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-bold text-[#1A1D28]">Danh Sách Thẻ</h2>
        <span className="rounded-full bg-[#EDEFF4] px-2.5 py-0.5 text-xs font-bold text-[#586380]">
          {count} Thẻ
        </span>
      </div>

      {(onToggleAddCard || onToggleBulkImport) && (
        <div className="flex items-center gap-2">
          {onToggleAddCard && (
            <button
              type="button"
              onClick={onToggleAddCard}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                showCardForm
                  ? "bg-[#1A1D28] text-white"
                  : "bg-white border border-[#E2E4E9] text-[#1A1D28] hover:bg-[#EDEFF4]"
              }`}
            >
              {showCardForm ? "✕ Đóng Form" : "＋ Thêm Thẻ"}
            </button>
          )}
          {onToggleBulkImport && (
            <button
              type="button"
              onClick={onToggleBulkImport}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                showBulkImport
                  ? "bg-[#4255FF] text-white"
                  : "bg-[#4255FF] text-white hover:bg-[#3344DD]"
              }`}
            >
              {showBulkImport ? "✕ Đóng Nhập Excel" : "📊 Nhập File Excel"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
