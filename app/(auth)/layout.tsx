import { Home07Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Header with Home button + Theme toggle */}
      <div className="absolute top-4 z-10 flex w-full justify-between px-4 lg:w-1/2 ">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-card">
            <HugeiconsIcon icon={Home07Icon} strokeWidth={2} className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </Link>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
