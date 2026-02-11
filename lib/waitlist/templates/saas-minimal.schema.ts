export type FieldType = 'string' | 'text'

export interface SectionFieldDef {
  type: FieldType
  label: string
  placeholder?: string
}

export interface SectionSchema {
  label: string
  fields?: Record<string, SectionFieldDef>
  repeatable?: boolean
  itemFields?: Record<string, SectionFieldDef>
  itemLabel?: string
  maxItems?: number
}

export type TemplateContentSchema = Record<string, SectionSchema>

export interface RepeatableItem {
  emoji?: string
  title: string
  description: string
}

export interface SaaSMinimalContent {
  hero: {
    headline: string
    subheadline: string
    helperText: string
  }
  'why-join': {
    sectionTitle: string
    sectionSubtitle: string
    items: RepeatableItem[]
  }
  problem: {
    badge: string
    title: string
    description: string
  }
  solution: {
    badge: string
    title: string
    description: string
  }
  'early-access': {
    sectionTitle: string
    sectionSubtitle: string
    items: RepeatableItem[]
  }
  'final-cta': {
    headline: string
    description: string
  }
}

export const saasMinimalContentSchema: TemplateContentSchema = {
  hero: {
    label: 'Hero',
    fields: {
      headline: {
        type: 'string',
        label: 'Headline',
        placeholder: 'Your main headline...',
      },
      subheadline: {
        type: 'text',
        label: 'Subheadline',
        placeholder: 'A short description of your product...',
      },
      helperText: {
        type: 'string',
        label: 'Helper text',
        placeholder: 'If you\'re already on the waitlist...',
      },
    },
  },
  'why-join': {
    label: 'Why Join',
    fields: {
      sectionTitle: {
        type: 'string',
        label: 'Section title',
        placeholder: 'Why Join?',
      },
      sectionSubtitle: {
        type: 'string',
        label: 'Section subtitle',
        placeholder: 'Here\'s what makes this worth it',
      },
    },
    repeatable: true,
    itemLabel: 'Reason',
    maxItems: 8,
    itemFields: {
      emoji: {
        type: 'string',
        label: 'Emoji',
        placeholder: '🎯',
      },
      title: {
        type: 'string',
        label: 'Title',
        placeholder: 'Reason title',
      },
      description: {
        type: 'string',
        label: 'Description',
        placeholder: 'Short description...',
      },
    },
  },
  problem: {
    label: 'Problem',
    fields: {
      badge: {
        type: 'string',
        label: 'Badge text',
        placeholder: 'The Problem',
      },
      title: {
        type: 'string',
        label: 'Title',
        placeholder: 'The Old Way Doesn\'t Work',
      },
      description: {
        type: 'text',
        label: 'Description',
        placeholder: 'Describe the problem your product solves...',
      },
    },
  },
  solution: {
    label: 'Solution',
    fields: {
      badge: {
        type: 'string',
        label: 'Badge text',
        placeholder: 'The Solution',
      },
      title: {
        type: 'string',
        label: 'Title',
        placeholder: 'A Better Way Forward',
      },
      description: {
        type: 'text',
        label: 'Description',
        placeholder: 'Describe how your product solves the problem...',
      },
    },
  },
  'early-access': {
    label: 'Early Access',
    fields: {
      sectionTitle: {
        type: 'string',
        label: 'Section title',
        placeholder: 'What Early Users Get',
      },
      sectionSubtitle: {
        type: 'string',
        label: 'Section subtitle',
        placeholder: 'Exclusive benefits for early supporters',
      },
    },
    repeatable: true,
    itemLabel: 'Perk',
    maxItems: 8,
    itemFields: {
      emoji: {
        type: 'string',
        label: 'Emoji',
        placeholder: '⚡',
      },
      title: {
        type: 'string',
        label: 'Title',
        placeholder: 'Perk title',
      },
      description: {
        type: 'string',
        label: 'Description',
        placeholder: 'Short description...',
      },
    },
  },
  'final-cta': {
    label: 'Final CTA',
    fields: {
      headline: {
        type: 'string',
        label: 'Headline',
        placeholder: 'Ready to Get Started?',
      },
      description: {
        type: 'text',
        label: 'Description',
        placeholder: 'Join the waitlist today...',
      },
    },
  },
}

export const saasMinimalDefaults: SaaSMinimalContent = {
  hero: {
    headline: '',
    subheadline: '',
    helperText: "If you're already on the waitlist, enter your email to see your progress.",
  },
  'why-join': {
    sectionTitle: 'Why Join?',
    sectionSubtitle: "Here's what makes this worth it",
    items: [
      { emoji: '🎯', title: 'Shape the Product', description: 'Your feedback directly influences what we build next.' },
      { emoji: '🚀', title: 'Early Access', description: 'Be among the first to experience new features before anyone else.' },
      { emoji: '🎁', title: 'Exclusive Perks', description: 'Unlock rewards and benefits reserved for early adopters.' },
      { emoji: '💬', title: 'Community Input', description: 'Join a community of forward-thinkers shaping the future.' },
    ],
  },
  problem: {
    badge: 'The Problem',
    title: "The Old Way Doesn't Work",
    description: 'Many teams struggle with inefficient workflows and lack the tools they need to collaborate effectively. This leads to wasted time, missed deadlines, and frustrated team members who can\'t focus on what matters most.',
  },
  solution: {
    badge: 'The Solution',
    title: 'A Better Way Forward',
    description: "We're building a platform that streamlines collaboration and automates repetitive tasks, giving teams more time to focus on innovation. Our approach combines powerful automation with an intuitive interface that anyone can use.",
  },
  'early-access': {
    sectionTitle: 'What Early Users Get',
    sectionSubtitle: 'Exclusive benefits for early supporters',
    items: [
      { emoji: '⚡', title: 'Beta Features', description: 'Access to beta features before public release' },
      { emoji: '🔗', title: 'Founding Team Access', description: 'Direct feedback loop with the founding team' },
      { emoji: '🛡️', title: 'Priority Support', description: 'Priority customer support and onboarding' },
      { emoji: '🏆', title: 'Exclusive Rewards', description: 'Exclusive rewards and perks for early adopters' },
    ],
  },
  'final-cta': {
    headline: 'Ready to Get Started?',
    description: 'Join the waitlist today and be among the first to experience the future.',
  },
}


