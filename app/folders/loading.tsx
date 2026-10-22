export default function FoldersLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12" aria-busy="true">
      <div className="mx-auto mb-14 h-24 max-w-xl animate-pulse rounded-2xl bg-surface" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-border/50 bg-surface" />
        ))}
      </div>
    </div>
  );
}
