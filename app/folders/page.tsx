import { Suspense } from "react";
import { connection } from "next/server";
import { getFolders } from "@/actions/folder-actions";
import { FoldersContainer } from "@/components/folders/folders-container";

export default async function FoldersPage() {
  await connection(); // luôn render động: dữ liệu đến từ DB, không prerender lúc build
  const res = await getFolders();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {res.success && res.data ? (
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/50" />}>
          <FoldersContainer initialFolders={res.data} />
        </Suspense>
      ) : (
        <div className="glass-card mx-auto max-w-md py-12 text-center">
          <div className="mb-3 text-4xl">⚠️</div>
          <p className="px-4 text-sm text-rose">{res.error || "Lỗi khi tải dữ liệu. Vui lòng thử lại!"}</p>
        </div>
      )}
    </div>
  );
}
