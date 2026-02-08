'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckCircle,
  Radar,
  GroupIcon,
  MentoringIcon,
  HutIcon,
  ShieldUserIcon,
  SphereIcon,
  Security,
  IdVerifiedIcon,
  BotIcon,
  Terminal,
} from '@hugeicons/core-free-icons'

interface PricingFeature {
  icon: any
  text: string
}

interface PricingPlan {
  id: string
  name: string
  badge?: string
  price: string
  period: string
  features: PricingFeature[]
  buttonText: string
  borderColor: string
  accentColor: string
  isPopular?: boolean
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'STARTER',
    price: '$0',
    period: '/mo',
    borderColor: 'border-accent',
    accentColor: 'text-accent',
    badge: undefined,
    features: [
      { icon: Radar, text: '1 Active Waitlist' },
      { icon: GroupIcon, text: '500 Subscribers / Mo' },
      { icon: MentoringIcon, text: 'Standard Analytics' },
    ],
    buttonText: 'Get Started',
  },
  {
    id: 'pro',
    name: 'PRO',
    badge: 'Most Popular',
    price: '$49',
    period: '/mo',
    borderColor: 'border-primary',
    accentColor: 'text-primary',
    isPopular: true,
    features: [
      { icon: CheckCircle, text: 'Unlimited Waitlists' },
      { icon: CheckCircle, text: 'Custom Domains' },
      { icon: CheckCircle, text: 'Advanced CRM Integration' },
      { icon: CheckCircle, text: 'White Label (No Branding)' },
    ],
    buttonText: 'GET STARTED',
  },
  {
    id: 'business',
    name: 'BUSINESS',
    price: '$199',
    period: '/mo',
    borderColor: 'border-tertiary',
    accentColor: 'text-tertiary',
    features: [
      { icon: HutIcon, text: 'Full White-Label Solution' },
      { icon: ShieldUserIcon, text: 'Dedicated Account Manager' },
      { icon: SphereIcon, text: 'Premium Support SLA' },
      { icon: Security, text: 'Audit Logs & SSO' },
    ],
    buttonText: 'Contact Sales',
  },
]

export function Pricing() {
  return (
    <section className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        {/* Title Section */}
        <div className="relative mb-32 text-center">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="bg-tertiary/10 px-4 py-1 font-black uppercase mb-4 text-sm text-tertiary">
              Transparent Pricing
            </span>
          </div>
          <h1 className="font-bebas-neue leading-[0.8] text-[clamp(60px,13vw,100px)] font-black uppercase italic text-primary">
            CHOOSE YOUR
            <br />
            <span className="text-stroke-primary">PLAN</span>
          </h1>
        </div>

        {/* Pricing Cards */}
        <div className="grid w-full max-w-[1400px] grid-cols-1 items-stretch gap-0 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative z-0 flex flex-col gap-10 border-8 bg-card/5 p-12 ${
                plan.borderColor
              } ${plan.isPopular ? 'z-20 scale-105 shadow-2xl lg:-mx-4' : 'lg:translate-y-8'} ${
                plan.isPopular ? 'border-12 p-16 gap-12' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary px-8 py-2 font-black uppercase italic tracking-widest text-primary-foreground">
                  {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="flex flex-col gap-2">
                <span
                  className={`font-black uppercase tracking-[0.3em] text-sm ${plan.accentColor}`}
                >
                  {plan.id === 'starter' ? 'Starter' : plan.id === 'pro' ? 'Professional' : 'Enterprise'} Plan
                </span>
                <h3
                  className={`font-bebas-neue uppercase italic leading-none ${
                    plan.isPopular ? 'text-7xl' : 'text-5xl'
                  } ${plan.id === 'pro' ? 'flex items-center gap-4' : ''}`}
                >
                  {plan.name}
                  {plan.id === 'pro' && (
                    <HugeiconsIcon
                      icon={IdVerifiedIcon}
                      className={`text-5xl ${plan.accentColor}`}
                    />
                  )}
                </h3>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-black tracking-tighter ${
                    plan.isPopular ? 'text-[clamp(60px,13vw,100px)] font-bebas-neue leading-none' : 'text-[clamp(60px,13vw,80px)] '
                  } text-secondary`}
                >
                  {plan.price}
                </span>
                <span
                  className={`font-black uppercase italic ${
                    plan.isPopular ? 'text-3xl' : 'text-2xl'
                  } text-muted-foreground`}
                >
                  {plan.period}
                </span>
              </div>

              {/* Divider */}
              <div
                className={`w-full ${
                  plan.isPopular ? 'h-1 bg-primary/30' : 'h-px'
                } ${plan.accentColor.replace('text-', 'bg-')}/20`}
              />

              {/* Features */}
              <ul className="flex-1 space-y-6">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-4 font-black uppercase tracking-tight ${
                      plan.isPopular ? 'text-xl' : 'text-sm tracking-wider'
                    }`}
                  >
                    <HugeiconsIcon
                      icon={feature.icon}
                      strokeWidth={2}
                      className={`${plan.accentColor} mt-0.5 ${
                        plan.isPopular ? 'scale-150 mt-1' : 'font-black'
                      }`}
                    />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              {plan.isPopular ? (
                <Button
                  className={`w-full bg-primary py-8 font-black uppercase tracking-[0.3em] text-2xl text-primary-foreground transition-all hover:scale-105 ${
                    plan.borderColor
                  }`}
                  style={{
                    boxShadow: '0 0 30px rgba(var(--primary-rgb), 0.5)',
                  }}
                >
                  {plan.buttonText}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className={`w-full font-space-mono border-4 py-5 font-black uppercase tracking-[0.2em] transition-all hover:bg-${plan.accentColor.replace('text-', '')} hover:border-${plan.accentColor.replace('text-', '')} hover:text-${plan.accentColor.replace('text-', '')}-foreground ${
                    plan.borderColor
                  } ${plan.accentColor}`}
                >
                  {plan.buttonText}
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>

    </section>
  )
}
