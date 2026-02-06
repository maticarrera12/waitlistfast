/**
 * Default Point Rules and Rewards for Referral Campaigns
 * 
 * These defaults provide a "batteries included" experience:
 * - Tested patterns from KickoffLabs, ViralLoops
 * - Simple to understand
 * - Powerful without being overwhelming
 * 
 * Philosophy: "Make the first campaign work out of the box"
 */

export interface DefaultPointRule {
  event: 'SIGNUP' | 'REFERRAL_CONFIRMED' | 'EMAIL_VERIFIED' | 'MILESTONE' | 'MANUAL'
  points: number
  conditions: any
  name: string
  description: string
  isActive: boolean
  priority: number
}

export interface DefaultReward {
  name: string
  description: string
  type: 'FEATURE' | 'ACCESS' | 'DISCOUNT' | 'CUSTOM'
  distributionRule: 'TOP_N' | 'MIN_SCORE' | 'MIN_REFERRALS' | 'MANUAL'
  ruleParams: any
  payload: any
  maxRecipients: number | null
}

/**
 * Standard Viral Launch Point Rules
 * These rules create a gamified experience that rewards:
 * - Initial signup
 * - Email verification
 * - Referrals (with bonuses for first and milestones)
 */
export function getDefaultPointRules(waitlistId: string): DefaultPointRule[] {
  return [
    {
      event: 'SIGNUP',
      points: 5,
      conditions: null, // No conditions - everyone gets this
      name: 'Signup Bonus',
      description: 'Welcome bonus for joining the waitlist',
      isActive: true,
      priority: 1,
    },
    {
      event: 'EMAIL_VERIFIED',
      points: 10,
      conditions: null, // No conditions - everyone who verifies gets this
      name: 'Email Verification Bonus',
      description: 'Bonus for verifying your email address',
      isActive: true,
      priority: 2,
    },
    {
      event: 'REFERRAL_CONFIRMED',
      points: 25,
      conditions: null, // No conditions - every referral gets this
      name: 'Referral Confirmed',
      description: 'Points for each friend you refer',
      isActive: true,
      priority: 3,
    },
    {
      event: 'REFERRAL_CONFIRMED',
      points: 50,
      conditions: { firstReferralOnly: true }, // Only first referral
      name: 'First Referral Bonus',
      description: 'Extra bonus for your first referral (the hardest one!)',
      isActive: true,
      priority: 4,
    },
    {
      event: 'REFERRAL_CONFIRMED',
      points: 100,
      conditions: { referralCount: { equals: 5 } }, // Exactly 5 referrals
      name: '5 Referrals Milestone',
      description: 'Milestone bonus when you reach 5 referrals',
      isActive: true,
      priority: 5,
    },
    {
      event: 'REFERRAL_CONFIRMED',
      points: 250,
      conditions: { referralCount: { equals: 10 } }, // Exactly 10 referrals
      name: '10 Referrals Milestone',
      description: 'Major milestone bonus when you reach 10 referrals',
      isActive: true,
      priority: 6,
    },
  ]
}

/**
 * Launch Incentives - Default Rewards
 * These rewards create tiers that motivate different user segments
 */
export function getDefaultRewards(campaignId: string): DefaultReward[] {
  return [
    {
      name: 'Early Access',
      description: 'Get early access before public launch',
      type: 'ACCESS',
      distributionRule: 'MIN_REFERRALS',
      ruleParams: { minReferrals: 3 },
      payload: {
        accessLevel: 'early',
        message: "You'll get early access before public launch",
      },
      maxRecipients: null,
    },
    {
      name: 'Power User',
      description: 'Unlock beta features and priority support',
      type: 'FEATURE',
      distributionRule: 'MIN_REFERRALS',
      ruleParams: { minReferrals: 10 },
      payload: {
        features: ['beta_features', 'priority_support'],
        badge: 'Power User',
      },
      maxRecipients: null,
    },
    {
      name: 'Top 10 Launch Winners',
      description: 'Exclusive perks reserved for top advocates',
      type: 'CUSTOM',
      distributionRule: 'TOP_N',
      ruleParams: { topN: 10 },
      payload: {
        title: 'Launch Champion',
        description: 'Exclusive perks reserved for top advocates',
      },
      maxRecipients: 10,
    },
    // Optional: Guaranteed Reward (disabled by default)
    {
      name: 'Community Builder',
      description: '50% discount coupon for reaching 500 points',
      type: 'DISCOUNT',
      distributionRule: 'MIN_SCORE',
      ruleParams: { minScore: 500 },
      payload: {
        coupon: 'LAUNCH-50',
        discount: '50%',
      },
      maxRecipients: null,
    },
  ]
}

