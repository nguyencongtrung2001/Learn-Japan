export function FoldersHeader() {
  return (
    <div className="relative mb-10 text-center sm:mb-14">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo/10 blur-[80px]" />
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        <span className="mr-3">📂</span>
        <span className="gradient-text">Bộ Thẻ Của Tôi</span>
      </h1>
      <p className="mx-auto max-w-xl text-base text-foreground-muted sm:text-lg">
        Tạo và quản lý các chủ đề từ vựng của bạn để bắt đầu quá trình học tập
      </p>
    </div>
  );
}
