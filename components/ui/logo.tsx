import Image from "next/image";
import React from "react";

import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }: LogoProps) => {
  const isRounded = className?.includes("rounded-full");
  return (
    <div className={cn("relative", className, isRounded && "overflow-hidden")}>
      <Image
        src="/logo/logo.png"
        alt="WaitlistFast Logo"
        fill
        priority
        className={cn("w-full h-full", isRounded ? "object-cover" : "object-contain")}
        quality={75}
      />
    </div>
  );
};

Logo.displayName = "Logo";

export default Logo;
