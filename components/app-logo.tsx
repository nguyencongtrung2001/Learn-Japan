export function AppLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Flashcard App Logo"
    >
      <defs>
        <linearGradient id="appLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="appLogoCard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="appLogoBolt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="appLogoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Background squircle */}
      <rect width="100" height="100" rx="24" fill="url(#appLogoBg)" />

      {/* Back card */}
      <rect
        x="23"
        y="21"
        width="46"
        height="58"
        rx="8"
        transform="rotate(-12 46 50)"
        fill="#ffffff"
        fillOpacity="0.32"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />

      {/* Front card */}
      <rect
        x="30"
        y="21"
        width="46"
        height="58"
        rx="8"
        fill="url(#appLogoCard)"
        filter="url(#appLogoShadow)"
        stroke="#ffffff"
        strokeWidth="1.5"
      />

      {/* Card line header */}
      <rect x="37" y="28" width="32" height="3" rx="1.5" fill="#cbd5e1" />

      {/* Lightning bolt */}
      <path
        d="M55 36 L43 51 L51 51 L47 69 L63 48 L54 48 Z"
        fill="url(#appLogoBolt)"
        stroke="#d97706"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
