import { connection } from "next/server";
import { getFolders } from "@/actions/folder-actions";
import { FoldersHeader } from "@/components/folders/folders-header";
import { CreateFolderSection } from "@/components/folders/create-folder-section";
import { FoldersGrid } from "@/components/folders/folders-grid";

export default async function FoldersPage() {
  await connection(); // luôn render động: dữ liệu đến từ DB, không prerender lúc build
  const res = await getFolders();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <FoldersHeader />
      <CreateFolderSection />

      {res.success && res.data ? (
        <FoldersGrid folders={res.data} />
      ) : (
        <div className="glass-card mx-auto max-w-md py-12 text-center">
          <div className="mb-3 text-4xl">⚠️</div>
          <p className="px-4 text-sm text-rose">{res.error || "Lỗi khi tải dữ liệu. Vui lòng thử lại!"}</p>
        </div>
      )}
    </div>
  );
}
