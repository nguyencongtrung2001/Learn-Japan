interface CorrectAnswerProps {
  label?: string;
  children: React.ReactNode;
  textClass?: string;
}

/** Khối "Đáp án đúng" hiển thị khi trả lời sai. */
export function CorrectAnswer({ label = "Đáp án đúng:", children, textClass = "text-2xl sm:text-3xl font-bold text-foreground" }: CorrectAnswerProps) {
  return (
    <div className="animate-fade-in mt-8 border-t border-border/50 pt-6 text-left">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-rose sm:text-sm">{label}</span>
      <span className={textClass}>{children}</span>
    </div>
  );
}
