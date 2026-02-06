import Navbar from '@/components/navbar/comp-582'
import React from 'react'

const MarketingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
        <Navbar />
        {children}
    </div>
  )
}

export default MarketingLayout