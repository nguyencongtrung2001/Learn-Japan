export default function QuizLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo border-t-transparent" />
    </div>
  );
}
