"use client";

import { getScoreTier } from "./dashboardKpiTheme";

type ScoreRingProps = {
  score: number;
  size?: number;
  /** Oscuro = texto blanco (legacy); claro = texto #0a0a0a */
  variant?: "dark" | "light";
};

export default function ScoreRing({
  score,
  size = 150,
  variant = "light",
}: ScoreRingProps) {
  const stroke = Math.max(12, Math.round(size * 0.08));
  const radius = size / 2 - stroke;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const { color } = getScoreTier(score);
  const isLight = variant === "light";

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: color }}
      />
      <svg
        height={size}
        width={size}
        className="relative z-10 -rotate-90 transform"
        aria-hidden
      >
        <circle
          stroke={isLight ? "rgba(38,43,39,0.08)" : "rgba(0,0,0,0.4)"}
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <span
          className={`font-black tracking-tighter drop-shadow-sm ${
            isLight ? "text-[#0a0a0a]" : "text-white"
          }`}
          style={{ fontSize: size * 0.38 }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
