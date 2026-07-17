/*
  The MedMinder mark.

  Gentian violet, the dye this app's whole palette is anchored in, was
  historically dispensed as a tincture: measured out drop by drop. The mark is
  an M whose center stroke extends into a stem and ends in a single drop, so
  the letterform and the idea (something measured with care) are one gesture,
  not an icon bolted onto a wordmark. Monoline and rounded to match Petrona's
  hand-set warmth rather than a cold geometric sans mark.

  Deliberately not a cross or a pill: both are the generic reach for any
  medicine app and carry none of this brand's specific material.
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
    >
      <path
        d="M9 30V14L24 25L39 14V30"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 25V35"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle cx="24" cy="38.5" r="3.1" fill={color} />
    </svg>
  );
}
