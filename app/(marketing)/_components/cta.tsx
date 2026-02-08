
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import React from 'react'

const CTA = () => {
  return (
    <div className='bg-background min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto w-full '>
        <div className='border-8 border-primary px-8 sm:px-12 py-16 sm:py-32 flex flex-col items-center gap-6 relative overflow-hidden'>
          {/* Efecto de glow con múltiples colores */}
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2'></div>
          <div className='absolute bottom-0 left-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3'></div>
          <div className='absolute bottom-0 left-0 w-72 h-72 bg-tertiary/25 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4'></div>
          <div className='absolute bottom-0 left-0 w-60 h-60 bg-accent/30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2'></div>
          <h1 className='text-[clamp(50px,10vw,120px)] font-bold font-bebas-neue italic text-center leading-[0.8]'>
            <span className='text-foreground'>READY TO GO</span> <br />
            <span className='text-primary underline decoration-primary'>HYPER-FAST?</span>
          </h1>
          
          <p className='text-center text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto'>
            Join the kit today and stop guessing. No credit card required. Pure momentum only.
          </p>
          
          <div className='flex flex-col sm:flex-row gap-4 w-full max-w-md'>
            <Input
              type='email' 
              placeholder='YOUR@EMAIL.COM' 
              className='flex-1 bg-background border-gray-700 text-foreground rounded-full px-6 py-6 text-center font-space-mono'
            />
            <Button className='bg-primary text-primary-foreground hover:bg-primary/80 rounded-full px-8 py-6 font-bold font-space-mono whitespace-nowrap'>
              GET ACCESS
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CTA