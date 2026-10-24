"use client";

import { useState, useMemo } from "react";
import { useNotesBoard } from "@/hooks/use-notes-board";
import {
  type NoteCard,
  type NoteLabelColor,
  type NoteChecklistItem,
  LABEL_COLORS,
} from "@/lib/notes-types";

export default function NotePage() {
  const {
    board,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    addColumn,
    updateColumn,
    deleteColumn,
    totalCardsCount,
  } = useNotesBoard();

  // Filter state
  const [selectedColorFilter, setSelectedColorFilter] = useState<
    NoteLabelColor | "all"
  >("all");

  // Inline "Add card" state for each column: colId currently adding to
  const [addingCardColId, setAddingCardColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardColor, setNewCardColor] = useState<NoteLabelColor>("blue");

  // Adding new column state (inline at end of board)
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  // Editing column title state
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState("");

  // Inline editing card state (No dialog!)
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState<NoteLabelColor | undefined>("blue");
  const [editColId, setEditColId] = useState("");
  const [editChecklist, setEditChecklist] = useState<NoteChecklistItem[]>([]);
  const [newCheckItemText, setNewCheckItemText] = useState("");

  // Start inline editing a card
  const handleStartEditCard = (card: NoteCard, colId: string) => {
    setEditingCardId(card.id);
    setEditTitle(card.title);
    setEditDesc(card.description || "");
    setEditColor(card.color || "blue");
    setEditColId(colId);
    setEditChecklist(card.checklist || []);
    setNewCheckItemText("");
  };

  // Save inline editing card
  const handleSaveCard = (cardId: string) => {
    if (!editTitle.trim()) return;
    updateCard(cardId, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      color: editColor,
      checklist: editChecklist,
      columnId: editColId,
    });
    setEditingCardId(null);
  };

  // Cancel inline editing
  const handleCancelEditCard = () => {
    setEditingCardId(null);
  };

  // Quick add card
  const handleQuickAddCard = (colId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    addCard(colId, newCardTitle.trim(), undefined, newCardColor);
    setNewCardTitle("");
    setAddingCardColId(null);
  };

  // Add column
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    addColumn(newColTitle.trim());
    setNewColTitle("");
    setIsAddingColumn(false);
  };

  // Filter cards based on color
  const filteredColumns = useMemo(() => {
    if (selectedColorFilter === "all") return board.columns;
    return board.columns.map((col) => ({
      ...col,
      cards: col.cards.filter((card) => card.color === selectedColorFilter),
    }));
  }, [board.columns, selectedColorFilter]);

  return (
    <div className="h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] flex flex-col overflow-hidden bg-background/40">
      {/* ─── Top Minimalist Toolbar ─────────────────────────────── */}
      <div className="border-b border-border/60 bg-surface/30 backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Color filter tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedColorFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                selectedColorFilter === "all"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-foreground-muted hover:text-foreground bg-surface/70"
              }`}
            >
              Tất cả
            </button>
            {(Object.keys(LABEL_COLORS) as NoteLabelColor[]).map((cKey) => {
              const isSelected = selectedColorFilter === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() =>
                    setSelectedColorFilter(isSelected ? "all" : cKey)
                  }
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                    isSelected
                      ? `${LABEL_COLORS[cKey].bg} ${LABEL_COLORS[cKey].text} ring-1 ${LABEL_COLORS[cKey].border}`
                      : "opacity-70 hover:opacity-100 bg-surface/40 text-foreground-muted"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${LABEL_COLORS[cKey].dot}`}
                  />
                  <span className="hidden md:inline">
                    {LABEL_COLORS[cKey].name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Add Column & Count summary */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-foreground-muted px-2 py-1 rounded-lg bg-surface/50 border border-border/50">
              📋 {totalCardsCount} thẻ
            </span>
            <button
              type="button"
              onClick={() => setIsAddingColumn(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo/30 bg-indigo/10 px-3 py-1.5 text-xs font-bold text-indigo-light hover:bg-indigo/20 hover:border-indigo/50 transition-all shadow-xs"
            >
              <span>＋</span> Thêm cột
            </button>
          </div>
        </div>
      </div>

      {/* ─── Board Canvas: Horizontal Columns ───────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6">
        <div className="flex h-full items-start gap-4 sm:gap-5">
          {filteredColumns.map((col, colIndex) => {
            const prevCol = colIndex > 0 ? filteredColumns[colIndex - 1] : null;
            const nextCol =
              colIndex < filteredColumns.length - 1
                ? filteredColumns[colIndex + 1]
                : null;

            return (
              <div
                key={col.id}
                className="flex h-full w-80 sm:w-[330px] shrink-0 flex-col rounded-2xl border border-border/70 bg-surface/45 backdrop-blur-xl p-3.5 shadow-sm transition-all hover:border-border"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  {editingColId === col.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editingColTitle.trim()) {
                          updateColumn(col.id, editingColTitle.trim());
                        }
                        setEditingColId(null);
                      }}
                      className="flex items-center gap-1 flex-1 mr-2"
                    >
                      <input
                        type="text"
                        value={editingColTitle}
                        onChange={(e) => setEditingColTitle(e.target.value)}
                        autoFocus
                        onBlur={() => {
                          if (editingColTitle.trim()) {
                            updateColumn(col.id, editingColTitle.trim());
                          }
                          setEditingColId(null);
                        }}
                        className="w-full rounded-lg border border-indigo/50 bg-surface px-2 py-0.5 text-xs font-bold text-foreground outline-none"
                      />
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 group/col flex-1 min-w-0 mr-2">
                      <h3
                        className="text-sm font-bold text-foreground truncate cursor-pointer hover:text-indigo-light transition-colors"
                        onClick={() => {
                          setEditingColId(col.id);
                          setEditingColTitle(col.title);
                        }}
                        title="Nhấn để đổi tên cột"
                      >
                        {col.title}
                      </h3>
                      <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-bold text-foreground-dim shrink-0">
                        {col.cards.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingColId(col.id);
                          setEditingColTitle(col.title);
                        }}
                        className="opacity-0 group-hover/col:opacity-100 text-foreground-dim hover:text-foreground text-[11px] transition-opacity p-0.5"
                        title="Đổi tên cột"
                      >
                        ✏️
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingCardColId(col.id);
                        setNewCardTitle("");
                      }}
                      className="text-foreground-dim hover:text-foreground p-1 text-xs transition-colors rounded-md hover:bg-surface"
                      title="Thêm thẻ nhanh"
                    >
                      ＋
                    </button>
                    {board.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Xóa danh sách "${col.title}" cùng toàn bộ thẻ bên trong?`
                            )
                          ) {
                            deleteColumn(col.id);
                          }
                        }}
                        className="text-foreground-dim hover:text-rose p-1 text-xs transition-colors rounded-md hover:bg-surface"
                        title="Xóa danh sách"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards Scrollable list */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {col.cards.map((card) => {
                    const isEditingThisCard = editingCardId === card.id;
                    const totalChecks = card.checklist?.length || 0;
                    const doneChecks =
                      card.checklist?.filter((c) => c.completed).length || 0;

                    // ─── Inline Edit Mode (No Dialog!) ──────────
                    if (isEditingThisCard) {
                      return (
                        <div
                          key={card.id}
                          className="rounded-xl border-2 border-indigo/60 bg-surface p-3 shadow-lg space-y-2.5 animate-scale-in"
                        >
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim">
                              Tiêu đề
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                              className="w-full mt-0.5 rounded-lg border border-border/80 bg-background/90 px-2.5 py-1.5 text-xs font-bold text-foreground outline-none focus:border-indigo"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim">
                              Mô tả
                            </label>
                            <textarea
                              rows={2}
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="Chi tiết ghi chú..."
                              className="w-full mt-0.5 rounded-lg border border-border/80 bg-background/90 px-2.5 py-1.5 text-xs text-foreground outline-none resize-none focus:border-indigo"
                            />
                          </div>

                          {/* Color label picker */}
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim block mb-1">
                              Màu nhãn
                            </label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(Object.keys(LABEL_COLORS) as NoteLabelColor[]).map(
                                (c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setEditColor(c)}
                                    className={`h-5 w-5 rounded-full ${
                                      LABEL_COLORS[c].dot
                                    } transition-transform ${
                                      editColor === c
                                        ? "ring-2 ring-foreground ring-offset-2 scale-110"
                                        : "opacity-60 hover:opacity-100"
                                    }`}
                                    title={LABEL_COLORS[c].name}
                                  />
                                )
                              )}
                            </div>
                          </div>

                          {/* Column selector */}
                          {board.columns.length > 1 && (
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim block mb-1">
                                Cột
                              </label>
                              <select
                                value={editColId}
                                onChange={(e) => setEditColId(e.target.value)}
                                className="w-full rounded-lg border border-border/80 bg-background/90 px-2 py-1 text-xs text-foreground outline-none"
                              >
                                {board.columns.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Checklist inline edit */}
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim block mb-1">
                              Checklist ({editChecklist.length})
                            </label>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                              {editChecklist.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-1.5 text-xs"
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => {
                                      setEditChecklist(
                                        editChecklist.map((it) =>
                                          it.id === item.id
                                            ? { ...it, completed: !it.completed }
                                            : it
                                        )
                                      );
                                    }}
                                    className="h-3.5 w-3.5 rounded accent-indigo"
                                  />
                                  <span
                                    className={`flex-1 truncate ${
                                      item.completed
                                        ? "line-through text-foreground-dim"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditChecklist(
                                        editChecklist.filter(
                                          (it) => it.id !== item.id
                                        )
                                      )
                                    }
                                    className="text-foreground-dim hover:text-rose text-[11px] p-0.5"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add item */}
                            <div className="flex items-center gap-1 mt-1.5">
                              <input
                                type="text"
                                value={newCheckItemText}
                                onChange={(e) =>
                                  setNewCheckItemText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    newCheckItemText.trim()
                                  ) {
                                    e.preventDefault();
                                    setEditChecklist([
                                      ...editChecklist,
                                      {
                                        id: `c-${Date.now()}`,
                                        text: newCheckItemText.trim(),
                                        completed: false,
                                      },
                                    ]);
                                    setNewCheckItemText("");
                                  }
                                }}
                                placeholder="+ Thêm việc cần làm (Enter)..."
                                className="flex-1 rounded-md border border-border/70 bg-background/80 px-2 py-0.5 text-xs text-foreground outline-none"
                              />
                            </div>
                          </div>

                          {/* Save & Cancel buttons */}
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelEditCard}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground-muted hover:bg-surface-hover"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveCard(card.id)}
                              className="rounded-lg bg-indigo px-3 py-1 text-xs font-bold text-white hover:bg-indigo-light transition-colors"
                            >
                              Lưu thay đổi
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // ─── Normal View Mode (Card on Board) ───────
                    return (
                      <div
                        key={card.id}
                        className="group relative rounded-xl border border-border/80 bg-surface/90 p-3 shadow-xs transition-all hover:border-indigo/40 hover:bg-surface hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {/* Top row: Color pill + Actions */}
                        <div className="flex items-center justify-between mb-1.5">
                          {card.color ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                LABEL_COLORS[card.color].bg
                              } ${LABEL_COLORS[card.color].text}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  LABEL_COLORS[card.color].dot
                                }`}
                              />
                              {LABEL_COLORS[card.color].name}
                            </span>
                          ) : (
                            <span />
                          )}

                          {/* Hover Action icons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {prevCol && (
                              <button
                                type="button"
                                onClick={() => moveCard(card.id, prevCol.id)}
                                className="h-6 w-6 rounded flex items-center justify-center text-[11px] text-foreground-dim hover:text-foreground hover:bg-surface-hover"
                                title={`Chuyển sang "${prevCol.title}"`}
                              >
                                ←
                              </button>
                            )}
                            {nextCol && (
                              <button
                                type="button"
                                onClick={() => moveCard(card.id, nextCol.id)}
                                className="h-6 w-6 rounded flex items-center justify-center text-[11px] text-foreground-dim hover:text-foreground hover:bg-surface-hover"
                                title={`Chuyển sang "${nextCol.title}"`}
                              >
                                →
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEditCard(card, col.id)}
                              className="h-6 w-6 rounded flex items-center justify-center text-[11px] text-foreground-dim hover:text-indigo-light hover:bg-surface-hover"
                              title="Chỉnh sửa thẻ"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Xóa thẻ "${card.title}"?`)) {
                                  deleteCard(card.id);
                                }
                              }}
                              className="h-6 w-6 rounded flex items-center justify-center text-[11px] text-foreground-dim hover:text-rose hover:bg-surface-hover"
                              title="Xóa thẻ"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Card Title */}
                        <h4
                          onClick={() => handleStartEditCard(card, col.id)}
                          className="text-sm font-bold text-foreground leading-snug cursor-pointer hover:text-indigo-light transition-colors"
                        >
                          {card.title}
                        </h4>

                        {/* Description snippet */}
                        {card.description && (
                          <p className="mt-1 text-xs text-foreground-muted leading-relaxed line-clamp-3">
                            {card.description}
                          </p>
                        )}

                        {/* Checklist items rendered directly on card */}
                        {totalChecks > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-border/50">
                            {/* Progress bar */}
                            <div className="flex items-center justify-between text-[10px] font-bold text-foreground-dim mb-1">
                              <span>Tiến độ</span>
                              <span>
                                {doneChecks}/{totalChecks} (
                                {Math.round((doneChecks / totalChecks) * 100)}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden mb-2">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(doneChecks / totalChecks) * 100}%`,
                                }}
                              />
                            </div>

                            {/* Direct checkboxes on card */}
                            <div className="space-y-1">
                              {card.checklist?.map((item) => (
                                <label
                                  key={item.id}
                                  className="flex items-center gap-2 text-xs cursor-pointer group/item hover:text-foreground"
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const updatedList = (
                                        card.checklist || []
                                      ).map((it) =>
                                        it.id === item.id
                                          ? { ...it, completed: !it.completed }
                                          : it
                                      );
                                      updateCard(card.id, {
                                        checklist: updatedList,
                                      });
                                    }}
                                    className="h-3.5 w-3.5 rounded accent-emerald-500 cursor-pointer"
                                  />
                                  <span
                                    className={`truncate text-xs ${
                                      item.completed
                                        ? "line-through text-foreground-dim"
                                        : "text-foreground-muted"
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {col.cards.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/60 p-4 text-center">
                      <p className="text-xs text-foreground-dim">
                        Chưa có thẻ nào
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Add Card inline */}
                <div className="mt-2 pt-2 border-t border-border/50">
                  {addingCardColId === col.id ? (
                    <form
                      onSubmit={(e) => handleQuickAddCard(col.id, e)}
                      className="space-y-2 rounded-xl border border-border bg-surface p-2.5 shadow-sm"
                    >
                      <input
                        type="text"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Nhập tiêu đề thẻ..."
                        autoFocus
                        className="w-full rounded-lg border border-border/80 bg-background/90 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-indigo"
                      />

                      {/* Pick color */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1">
                          {(
                            Object.keys(LABEL_COLORS) as NoteLabelColor[]
                          ).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewCardColor(c)}
                              className={`h-4 w-4 rounded-full ${
                                LABEL_COLORS[c].dot
                              } transition-transform ${
                                newCardColor === c
                                  ? "ring-2 ring-foreground scale-110"
                                  : "opacity-50 hover:opacity-100"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAddingCardColId(null);
                              setNewCardTitle("");
                            }}
                            className="rounded-lg px-2 py-1 text-xs text-foreground-dim hover:text-foreground"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={!newCardTitle.trim()}
                            className="rounded-lg bg-indigo px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-light disabled:opacity-50 transition-colors"
                          >
                            Thêm
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingCardColId(col.id);
                        setNewCardTitle("");
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold text-foreground-dim hover:bg-surface hover:text-foreground transition-colors"
                    >
                      <span>＋</span> Thêm thẻ mới
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* ─── Add Column placeholder inline (No Dialog!) ──────── */}
          {isAddingColumn ? (
            <div className="w-80 shrink-0 rounded-2xl border-2 border-dashed border-indigo/40 bg-surface/40 p-3.5 backdrop-blur-md">
              <form onSubmit={handleAddColumn} className="space-y-2.5">
                <input
                  type="text"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Tiêu đề danh sách..."
                  autoFocus
                  className="w-full rounded-xl border border-indigo/40 bg-background/90 px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-indigo"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!newColTitle.trim()}
                    className="flex-1 rounded-xl bg-indigo py-1.5 text-xs font-bold text-white hover:bg-indigo-light disabled:opacity-50 transition-colors"
                  >
                    Tạo danh sách
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingColumn(false);
                      setNewColTitle("");
                    }}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-surface-hover"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingColumn(true)}
              className="flex h-36 w-72 shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-surface/20 text-xs font-bold text-foreground-dim hover:border-indigo/50 hover:bg-surface/50 hover:text-indigo-light transition-all"
            >
              <span>＋</span> Thêm danh sách mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
