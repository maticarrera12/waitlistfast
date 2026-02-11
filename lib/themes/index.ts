// Main exports for the theme system
export * from './types'
export * from './config'
export * from './utils'
export * from './hooks'

// Re-export commonly used functions
export { getTheme, getAllThemes, isValidTheme } from './config'
export { useThemeConfig, getThemeClasses, withTheme, getThemeColor, getThemeStyles } from './utils'
export { useTheme } from './hooks'


