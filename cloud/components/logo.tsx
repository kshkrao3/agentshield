export function LogoIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="shieldGradDark" x1="0" y1="0" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Shield fill (subtle) */}
      <path
        d="M20 2L37 8.5V19C37 29.5 29.5 38 20 42C10.5 38 3 29.5 3 19V8.5L20 2Z"
        fill="url(#shieldGradDark)"
      />
      {/* Shield stroke */}
      <path
        d="M20 2L37 8.5V19C37 29.5 29.5 38 20 42C10.5 38 3 29.5 3 19V8.5L20 2Z"
        stroke="url(#shieldGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Checkmark */}
      <path
        d="M12 21L17.5 27L28 15"
        stroke="url(#shieldGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />
    </svg>
  );
}

export function LogoFull({
  size = 28,
  dark = false,
  className = "",
}: {
  size?: number;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <LogoIcon size={size} />
      <span className={dark ? "text-white" : ""}>
        AgentShield <span className={dark ? "text-green-400" : "text-green-600"}>Cloud</span>
      </span>
    </span>
  );
}
