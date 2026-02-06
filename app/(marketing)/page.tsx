import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import CTA from "./_components/cta";
import { GlowingEffectDemo } from "./_components/feature";
import Hero from "./_components/hero";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session?.user;

  return <div>
    <Hero isAuthenticated={isAuthenticated} />
    <GlowingEffectDemo />
    <CTA />
    </div>;
}