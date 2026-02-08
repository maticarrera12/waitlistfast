import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import CTA from "./_components/cta";
import { GlowingEffectDemo } from "./_components/feature";
import Hero from "./_components/hero";
import { CardBeam } from "./_components/card-beam";
import { Pricing } from "./_components/pricing";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session?.user;

  return <div>
    <Hero isAuthenticated={isAuthenticated} />
    <div className='max-w-7xl mx-auto flex flex-col items-center justify-center gap-4'>
      <h1 className='text-[clamp(60px,13vw,100px)] font-bebas-neue leading-[0.8] font-bold italic text-center'>CHOOSE YOUR  <br /><span className='from-primary via-white to-primary bg-linear-to-r bg-clip-text text-transparent'>VIBE</span></h1>
      <p className='text-center text-xl text-muted-foreground max-w-2xl mx-auto'>Pick an Aesthetic for your waitlist</p>
    </div>
    <CardBeam />
    <GlowingEffectDemo />
    <Pricing />
    <CTA />
    </div>;
}