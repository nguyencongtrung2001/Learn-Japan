import { connection } from "next/server";
import type { Metadata } from "next";
import { getLatestDashboardData } from "@/actions/latest-actions";
import { LatestDashboard } from "@/components/latest/latest-dashboard";

export const metadata: Metadata = {
  title: "Gần đây | Quizlet Dashboard - Flashcard App",
  description: "Trang hoạt động gần đây, học phần đang ôn tập và khám phá các bộ thẻ từ vựng phong cách Quizlet.",
};

export default async function LatestPage() {
  await connection();
  const res = await getLatestDashboardData();

  if (!res.success || !res.data) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center space-y-4">
        <div className="glass-card max-w-md mx-auto p-8 rounded-3xl border border-border shadow-xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-lg font-bold text-foreground mb-2">
            Không thể tải dữ liệu gần đây
          </h1>
          <p className="text-xs text-rose mb-4">
            {res.error || "Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau!"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <LatestDashboard initialData={res.data} />
    </main>
  );
}
