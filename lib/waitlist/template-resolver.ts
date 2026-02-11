import { saasMinimalTemplate } from './templates/saas-minimal.template'

export type Template = {
  key: string
  name: string
  sections: readonly string[]
}

const templates: Record<string, Template> = {
  'saas-minimal': saasMinimalTemplate,
}

export function resolveTemplate(templateKey: string | null | undefined): Template {
  if (!templateKey) {
    return saasMinimalTemplate
  }
  
  return templates[templateKey] || saasMinimalTemplate
}

