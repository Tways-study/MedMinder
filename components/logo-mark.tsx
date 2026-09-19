import Image from "next/image";
import medminderIcon from "@/images/medminder-icon.png";

export function LogoMark({ className }: { className?: string }) {
  return <Image src={medminderIcon} alt="MedMinder" className={className} />;
}
