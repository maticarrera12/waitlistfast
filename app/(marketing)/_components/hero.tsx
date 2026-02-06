import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

interface HeroProps {
  isAuthenticated: boolean
}

const Hero = ({ isAuthenticated }: HeroProps) => {
  const buildListHref = isAuthenticated ? '/dashboard' : '/signin'

  return (
    <div className='bg-background min-h-screen flex items-center justify-center'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-8'>
            <div className='flex flex-col items-center justify-center'>
                <div className='space-y-6'>
                <h1 className='text-[clamp(60px,13vw,160px)] font-bold font-bebas-neue italic text-center leading-[0.8]'>
  <span className='text-primary'>STOP WAITING.</span> <br />
  START LAUNCHING <br />
  <span className='text-accent underline decoration-tertiary'>VIRAL WAITLISTS.</span>
</h1>
                <p className='text-center text-xl text-muted-foreground max-w-2xl mx-auto'>The waitlist engine for products that don&apos;t do 'quiet launches'. High-impact tools for high-growth builders</p>
                </div>
            </div>
            <div className='flex gap-4'>
                <Button asChild className='bg-primary text-primary-foreground hover:bg-primary/80 rounded-full p-6 font-bold font-space-mono'>
                    <Link href={buildListHref}>BUILD YOUR LIST</Link>
                </Button>
                <Button className='bg-background border border-gray-700 text-foreground hover:bg-secondary/80 rounded-full p-6 font-bold font-space-mono'>VIEW DEMO</Button>
            </div>
        </div>
    </div>
  )
}

export default Hero