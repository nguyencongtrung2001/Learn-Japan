export function AppLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-[#4255FF] flex items-center justify-center text-white font-black select-none`}
      style={{ fontSize: "clamp(14px, 60%, 22px)" }}
      aria-label="Q Logo"
    >
      Q
    </div>
  );
}
