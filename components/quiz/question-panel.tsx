import type { Feedback } from "@/lib/quiz";

interface QuestionPanelProps {
  feedback: Feedback;
  className?: string;
  children: React.ReactNode;
}

/** Khung câu hỏi dùng chung: viền/bóng đổi màu theo đúng–sai, rung khi sai. */
export function QuestionPanel({ feedback, className = "", children }: QuestionPanelProps) {
  const tone =
    feedback === "correct"
      ? "shadow-emerald/20 border-emerald/50"
      : feedback === "incorrect"
        ? "shadow-rose/20 border-rose/50 animate-shake"
        : "shadow-indigo/5 border-white/5";

  const defaultMaxWidth = className.includes("max-w-") ? "" : "max-w-md";

  return (
    <div
      className={`glass-card relative mx-auto w-full ${defaultMaxWidth} overflow-hidden text-center shadow-2xl transition-all duration-500 ${tone} ${className}`}
    >
      {feedback === "correct" && <div className="animate-fade-in absolute inset-0 bg-emerald/5" />}
      {feedback === "incorrect" && <div className="animate-fade-in absolute inset-0 bg-rose/5" />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
