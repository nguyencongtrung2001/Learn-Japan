// app/folders/[id]/tracker/page.tsx


import Link from "next/link";
import { MonthlyTracker } from "@/components/folder/monthly-tracker";

export default async function TrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const folderId = Number.parseInt(id, 10);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold gradient-text">📅 Theo dõi học tháng</h1>
        <Link
          href={`/folders/${folderId}`}
          className="text-sm font-medium text-foreground-muted hover:text-indigo-light transition-colors"
        >
          ← Quay lại thư mục
        </Link>
      </div>
      <MonthlyTracker folderId={folderId} />
    </div>
  );
}
