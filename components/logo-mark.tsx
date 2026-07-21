/*
  The MedMinder Logo Mark (Concept 4 - Pastel Infinity M & Medical Cross).

  Anchored in MedMinder's gentian violet & soft pastel lilac aesthetic.
  The continuous infinity loop ribbon forms an 'M' monogram, representing
  continuous inventory tracking and stock cycle balance, with a delicate
  centered medical cross accent.
*/
export function LogoMark({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="MedMinder"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="medminder-logo-pastel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--orchid))" />
          <stop offset="100%" stopColor="hsl(var(--amethyst))" />
        </linearGradient>
      </defs>

      {/* Smooth Infinity M Ribbon Outer Fill & Contour */}
      <path
        d="M 8,32 C 4,24 8,14 16,14 C 21,14 24,19 24,24 C 24,19 27,14 32,14 C 40,14 44,24 40,32 C 36,40 28,34 24,27 C 20,34 12,40 8,32 Z"
        fill="url(#medminder-logo-pastel)"
        fillOpacity="0.12"
        stroke={color === "currentColor" ? "url(#medminder-logo-pastel)" : color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Soft Inner M Flow Line */}
      <path
        d="M 11,30 C 8,24 11,17 16,17 C 20,17 22.5,21 24,24.5 C 25.5,21 28,17 32,17 C 37,17 40,24 37,30"
        stroke={color === "currentColor" ? "hsl(var(--orchid))" : color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Centered Medical Cross Accent */}
      <rect x="22.5" y="21" width="3" height="7" rx="1.5" fill={color === "currentColor" ? "hsl(var(--orchid))" : color} />
      <rect x="20.5" y="23" width="7" height="3" rx="1.5" fill={color === "currentColor" ? "hsl(var(--orchid))" : color} />
    </svg>
  );
}
