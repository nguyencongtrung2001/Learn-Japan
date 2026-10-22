export function EmptyCards() {
  return (
    <div className="glass-card border-2 border-dashed border-border/50 py-20 text-center">
      <div className="mb-6 text-6xl">📭</div>
      <p className="mb-2 text-lg font-bold text-foreground">Thư mục đang trống</p>
      <p className="text-sm text-foreground-muted">
        Bấm &quot;Thêm Thẻ Mới&quot; hoặc &quot;Nhập nhanh&quot; để tạo từ vựng.
      </p>
    </div>
  );
}
