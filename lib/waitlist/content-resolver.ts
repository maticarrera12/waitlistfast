import {
  saasMinimalDefaults,
  saasMinimalContentSchema,
  type SaaSMinimalContent,
  type TemplateContentSchema,
} from './templates/saas-minimal.schema'

const defaultsRegistry: Record<string, SaaSMinimalContent> = {
  'saas-minimal': saasMinimalDefaults,
}

const schemaRegistry: Record<string, TemplateContentSchema> = {
  'saas-minimal': saasMinimalContentSchema,
}

function deepMerge(defaults: any, stored: any): any {
  if (stored === null || stored === undefined) return defaults
  if (typeof defaults !== 'object' || Array.isArray(defaults)) {
    return stored !== undefined && stored !== null ? stored : defaults
  }

  const result: Record<string, any> = {}

  for (const key of Object.keys(defaults)) {
    if (key === 'items' && Array.isArray(defaults[key])) {
      result[key] = Array.isArray(stored[key]) && stored[key].length > 0
        ? stored[key]
        : defaults[key]
    } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = deepMerge(defaults[key], stored?.[key])
    } else {
      result[key] = (stored?.[key] !== undefined && stored?.[key] !== null && stored?.[key] !== '')
        ? stored[key]
        : defaults[key]
    }
  }

  return result
}

export function resolveContent(
  templateKey: string,
  storedContent: Record<string, any> | null | undefined,
): SaaSMinimalContent {
  const defaults = defaultsRegistry[templateKey] || defaultsRegistry['saas-minimal']
  if (!storedContent) return { ...defaults }
  return deepMerge(defaults, storedContent)
}

export function getContentSchema(templateKey: string): TemplateContentSchema {
  return schemaRegistry[templateKey] || schemaRegistry['saas-minimal']
}

export function getContentDefaults(templateKey: string): SaaSMinimalContent {
  return defaultsRegistry[templateKey] || defaultsRegistry['saas-minimal']
}
