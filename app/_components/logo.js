export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 4 L42 11 V22 C42 32 34.5 40 24 44 C13.5 40 6 32 6 22 V11 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M24 14 L33 34 M24 14 L15 34 M18.5 27 H29.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 28, textClassName = 'text-lg', tagline = false, light = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} className={light ? 'text-white' : 'text-brand-600'} />
      <div>
        <span
          className={`font-display font-bold tracking-tight ${light ? 'text-white' : 'text-brand-700'} ${textClassName}`}
        >
          AcadPK
        </span>
        {tagline && (
          <p className={`text-[11px] -mt-1 ${light ? 'text-white/70' : 'text-muted'}`}>
            Academy Management System
          </p>
        )}
      </div>
    </div>
  );
}
