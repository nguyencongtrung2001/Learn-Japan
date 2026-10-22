export function CardsHeader({ count }: { count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="gradient-text text-xl font-extrabold">🃏 Danh Sách Thẻ</h2>
      <span className="rounded-full border border-border/50 bg-surface px-3 py-1 text-sm font-semibold text-foreground-muted">
        {count} Thẻ
      </span>
    </div>
  );
}
