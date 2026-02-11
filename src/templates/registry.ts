import { SaaSMinimalTemplate } from '@/components/waitlist/templates/saas-minimal'
import { StartupMinimalTemplate } from './startup-minimal/index'
import { MobileAppTemplate } from '@/components/waitlist/templates/mobile-app'

export const TEMPLATE_REGISTRY = {
  'saas-minimal': SaaSMinimalTemplate,
  'startup-minimal': StartupMinimalTemplate,
  'mobile-app': MobileAppTemplate,
} as const

export type TemplateKey = keyof typeof TEMPLATE_REGISTRY

export function getTemplate(templateKey: string) {
  const key = templateKey as TemplateKey
  return TEMPLATE_REGISTRY[key] || TEMPLATE_REGISTRY['saas-minimal']
}
