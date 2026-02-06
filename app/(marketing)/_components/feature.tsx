"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";
import { Rocket, Palette, Share, Clock, Code } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function GlowingEffectDemo() {
  return (
    <ul className="grid grid-cols-1  grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-136 max-w-7xl mx-auto xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<HugeiconsIcon icon={Rocket} strokeWidth={2} className="h-4 w-4" />}
        title="Launch viral waitlists in minutes"
        description="Create high-converting waitlists with built-in referrals, rewards, and real-time positions — without hacks, spreadsheets, or duct tape."
      />
      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<HugeiconsIcon icon={Palette} strokeWidth={2} className="h-4 w-4" />}
        title="Design-first landing pages"
        description="Beautiful, customizable landing pages that don't look like every other SaaS. Themes, colors, typography, and layouts — your brand, not ours."
      />
      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<HugeiconsIcon icon={Share} strokeWidth={2} className="h-4 w-4" />}
        title="Built-in viral mechanics"
        description="Referrals, rewards, tiers, and leaderboards baked into the product. Every signup helps you grow faster — automatically."
      />
      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<HugeiconsIcon icon={Clock} strokeWidth={2} className="h-4 w-4" />}
        title="Real-time, everywhere"
        description="Live signup counters, instant position updates, and dashboards that refresh as things happen. No reloads. No waiting."
      />
      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<HugeiconsIcon icon={Code} strokeWidth={2} className="h-4 w-4" />}
        title="Founder-friendly. Developer-approved."
        description="Built with a modern stack, strong defaults, and room to grow. Simple to start, powerful when you need more."
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
