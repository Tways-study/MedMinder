/*
  The MedMinder logo mark: an infinity ribbon (stock that is always being
  tracked) under a medical cross. It is the same drawing as the favicon in
  app/icon.svg, minus the tile, so the tab and the app header agree.

  One flat colour, no gradient: the mark carries the single accent, orchid,
  and nothing competes with it.
*/
export function LogoMark({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  const ink = color === "currentColor" ? "hsl(var(--primary))" : color;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="MedMinder"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        transform="translate(24 30) scale(0.95) translate(-24 -25.5)"
        d="M 8,32 C 4,24 8,14 16,14 C 21,14 24,19 24,24 C 24,19 27,14 32,14 C 40,14 44,24 40,32 C 36,40 28,34 24,27 C 20,34 12,40 8,32 Z"
        fill={ink}
        fillOpacity="0.12"
        stroke={ink}
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <rect x="22.4" y="3.5" width="3.2" height="9.5" rx="1.6" fill={ink} />
      <rect x="19.25" y="6.65" width="9.5" height="3.2" rx="1.6" fill={ink} />
    </svg>
  );
}
