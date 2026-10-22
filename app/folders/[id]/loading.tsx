/** Skeleton hiển thị tức thì khi chuyển trang, khớp bố cục thật (sidebar + lưới 3 cột). */
export default function FolderLoading() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12" aria-busy="true">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 space-y-5 lg:w-64 xl:w-72">
          <div className="h-40 animate-pulse rounded-2xl border border-border/50 bg-surface" />
          <div className="h-12 animate-pulse rounded-2xl bg-surface" />
          <div className="h-10 animate-pulse rounded-xl bg-surface" />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-4 h-8 w-48 animate-pulse rounded-lg bg-surface" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border border-border/50 bg-surface" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
