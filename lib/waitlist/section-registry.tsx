'use client'

import { HeroSection } from '@/components/waitlist/templates/saas-minimal/HeroSection'
import { WhyJoinSection } from '@/components/waitlist/templates/saas-minimal/WhyJoinSection'
import { ProblemSection } from '@/components/waitlist/templates/saas-minimal/ProblemSection'
import { SolutionSection } from '@/components/waitlist/templates/saas-minimal/SolutionSection'
import { EarlyAccessSection } from '@/components/waitlist/templates/saas-minimal/EarlyAccessSection'
import { FinalCTASection } from '@/components/waitlist/templates/saas-minimal/FinalCTASection'
import { Rewards } from '@/src/templates/shared/Rewards'
import { PointRules } from '@/src/templates/shared/PointRules'
import type { ThemeName } from '@/lib/themes'
import type { RewardModel } from '@/src/generated/models/Reward'
import type { PointRuleModel } from '@/src/generated/models/PointRule'
import type { SaaSMinimalContent } from '@/lib/waitlist/templates/saas-minimal.schema'

export interface SectionProps {
  waitlist: {
    id: string
    name: string
    slug?: string
    headline: string | null
    description: string | null
    settings: any
  }
  subscriberCount: number
  subscriber?: {
    id: string
    email: string
    score: number
    position: number | null
    referralCount: number
  } | null
  themeName: ThemeName
  rewards?: RewardModel[]
  pointRules?: PointRuleModel[]
  content?: SaaSMinimalContent
}

const HeroWrapper = (props: SectionProps) => {
  if (!props.content) return null
  return (
    <HeroSection
      waitlist={props.waitlist}
      subscriberCount={props.subscriberCount}
      themeName={props.themeName}
      content={props.content.hero}
    />
  )
}

const WhyJoinWrapper = (props: SectionProps) => {
  if (!props.content) return null
  return (
    <WhyJoinSection
      themeName={props.themeName}
      content={props.content['why-join']}
    />
  )
}

const ProblemWrapper = (props: SectionProps) => {
  if (!props.content) return null
  return (
    <ProblemSection
      themeName={props.themeName}
      content={props.content.problem}
    />
  )
}

const SolutionWrapper = (props: SectionProps) => {
  if (!props.content) return null
  return (
    <SolutionSection
      themeName={props.themeName}
      content={props.content.solution}
    />
  )
}

const EarlyAccessWrapper = (props: SectionProps) => {
  if (!props.content) return null
  return (
    <EarlyAccessSection
      themeName={props.themeName}
      content={props.content['early-access']}
    />
  )
}

const FinalCTAWrapper = (props: SectionProps) => {
  if (!props.content) return null
  return (
    <FinalCTASection
      waitlist={props.waitlist}
      subscriberCount={props.subscriberCount}
      themeName={props.themeName}
      content={props.content['final-cta']}
    />
  )
}

const RewardsWrapper = (props: SectionProps) => {
  if (!props.rewards || props.rewards.length === 0) return null
  return <Rewards rewards={props.rewards} subscriber={props.subscriber || null} themeName={props.themeName} />
}

const PointRulesWrapper = (props: SectionProps) => {
  if (!props.pointRules || props.pointRules.length === 0) return null
  return <PointRules pointRules={props.pointRules} themeName={props.themeName} />
}

export const sectionRegistry = {
  hero: HeroWrapper,
  'why-join': WhyJoinWrapper,
  problem: ProblemWrapper,
  solution: SolutionWrapper,
  'early-access': EarlyAccessWrapper,
  'final-cta': FinalCTAWrapper,
  rewards: RewardsWrapper,
  'point-rules': PointRulesWrapper,
} as const

export type SectionKey = keyof typeof sectionRegistry
