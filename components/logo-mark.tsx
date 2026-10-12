import Image from "next/image";
import medminderIcon from "@/images/medminder-icon.png";
import { cn } from "@/lib/utils";

/**
 * Decorative: every placement sits beside the "MedMinder" wordmark or a heading
 * that names the product, so the image is hidden from assistive tech.
 */
export function LogoMark({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={medminderIcon}
      alt=""
      aria-hidden
      priority={priority}
      className={cn("rounded-md", className)}
    />
  );
}
