"use client";

type IconProps = { size?: number; className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function KpiHealthIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" {...stroke} />
    </svg>
  );
}

export function KpiFugasAlertIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path
        d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
        {...stroke}
      />
      <path d="M12 9v4" {...stroke} />
      <path d="M12 17h.01" {...stroke} />
    </svg>
  );
}

export function KpiFugasOkIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" {...stroke} />
      <polyline points="22 4 12 14.01 9 11.01" {...stroke} />
    </svg>
  );
}
