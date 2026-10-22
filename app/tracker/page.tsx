import { MonthlyTracker } from "@/components/folder/monthly-tracker";

export default function TrackerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold gradient-text mb-6">
        📅 Theo dõi học tập
      </h1>
      <MonthlyTracker />
    </div>
  );
}
