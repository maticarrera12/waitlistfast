import { ThemeConfig, ThemeName } from './types'
import { getTheme } from './config'
import { cn } from '@/lib/utils'
import type React from 'react'

/**
 * Obtiene la configuración completa de un tema
 */
export function useThemeConfig(themeName: ThemeName): ThemeConfig {
  return getTheme(themeName)
}

/**
 * Obtiene las clases CSS para un componente específico según el tema
 */
export function getThemeClasses(themeName: ThemeName, component: keyof ThemeConfig['classes']): string {
  const theme = getTheme(themeName)
  return theme.classes[component] || ''
}

/**
 * Combina clases base con clases del tema
 */
export function withTheme(
  themeName: ThemeName,
  component: keyof ThemeConfig['classes'],
  additionalClasses?: string
): string {
  const themeClasses = getThemeClasses(themeName, component)
  return cn(themeClasses, additionalClasses)
}

/**
 * Obtiene el color primario del tema como valor CSS
 */
export function getThemeColor(themeName: ThemeName, colorKey: keyof ThemeConfig['colors']): string {
  const theme = getTheme(themeName)
  const color = theme.colors[colorKey]
  return color ?? theme.colors.primary // Fallback to primary if color is undefined
}

/**
 * Obtiene estilos inline para aplicar colores del tema
 */
export function getThemeStyles(themeName: ThemeName) {
  const theme = getTheme(themeName)
  return {
    '--theme-bg': theme.colors.background,
    '--theme-fg': theme.colors.foreground,
    '--theme-primary': theme.colors.primary,
    '--theme-accent': theme.colors.accent,
    '--theme-muted': theme.colors.muted,
    '--theme-border': theme.colors.border,
  } as React.CSSProperties
}

/**
 * Obtiene las clases para el contenedor principal según el tema
 */
export function getContainerClasses(themeName: ThemeName): string {
  return withTheme(themeName, 'container', 'min-h-screen')
}

/**
 * Obtiene las clases para un heading según el tema
 */
export function getHeadingClasses(themeName: ThemeName, size: 'sm' | 'md' | 'lg' | 'xl' = 'lg'): string {
  const theme = getTheme(themeName)
  const sizeClasses = {
    sm: theme.typography.fontSize.xl,
    md: theme.typography.fontSize['2xl'],
    lg: theme.typography.fontSize['4xl'],
    xl: theme.typography.fontSize['6xl'],
  }
  return cn(theme.classes.heading, sizeClasses[size])
}

/**
 * Obtiene las clases para un botón según el tema y variante
 */
export function getButtonClasses(
  themeName: ThemeName,
  variant: 'primary' | 'secondary' = 'primary'
): string {
  const variantKey = variant === 'primary' ? 'buttonPrimary' : 'buttonSecondary'
  return withTheme(themeName, variantKey, 'px-6 py-3 font-medium transition-all')
}

/**
 * Obtiene las clases para un input según el tema
 */
export function getInputClasses(themeName: ThemeName): string {
  return withTheme(themeName, 'input', 'px-4 py-2 w-full')
}

/**
 * Obtiene las clases para una card según el tema
 */
export function getCardClasses(themeName: ThemeName): string {
  return withTheme(themeName, 'card', 'p-6')
}

