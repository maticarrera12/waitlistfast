export const saasMinimalTemplate = {
  key: 'saas-minimal',
  name: 'SaaS Validation Waitlist',
  sections: [
    'hero',
    'why-join',
    'problem',
    'solution',
    'early-access',
    'final-cta',
    'rewards',
    'point-rules'
  ]
} as const

export type SaaSMinimalSection = typeof saasMinimalTemplate.sections[number]

