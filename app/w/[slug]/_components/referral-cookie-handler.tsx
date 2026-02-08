'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Component that captures the referral code from URL query parameter (?ref=CODE)
 * and stores it in a cookie so it persists when the user submits the form.
 */
export function ReferralCookieHandler() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  useEffect(() => {
    if (refCode) {
      // Set cookie that expires in 30 days
      const expires = new Date()
      expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      document.cookie = `waitlist_ref=${refCode}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    }
  }, [refCode])

  return null // This component doesn't render anything
}

