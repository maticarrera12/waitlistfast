'use client'

import { useMemo } from 'react'
import { ThemeConfig, ThemeName } from './types'
import { getTheme } from './config'
import { useThemeConfig, getThemeClasses, getThemeColor, getThemeStyles, withTheme } from './utils'

/**
 * Hook para usar la configuración de un tema en componentes client
 */
export function useTheme(themeName: ThemeName) {
  return useMemo(() => {
    const config = useThemeConfig(themeName)
    const styles = getThemeStyles(themeName)
    
    return {
      config,
      styles,
      classes: {
        container: getThemeClasses(themeName, 'container'),
        heading: getThemeClasses(themeName, 'heading'),
        body: getThemeClasses(themeName, 'body'),
        button: getThemeClasses(themeName, 'button'),
        buttonPrimary: getThemeClasses(themeName, 'buttonPrimary'),
        buttonSecondary: getThemeClasses(themeName, 'buttonSecondary'),
        input: getThemeClasses(themeName, 'input'),
        card: getThemeClasses(themeName, 'card'),
        badge: getThemeClasses(themeName, 'badge'),
      },
      colors: config.colors,
      typography: config.typography,
      layout: config.layout,
      animations: config.animations,
      // Helper methods
      withTheme: (component: keyof ThemeConfig['classes'], additionalClasses?: string) =>
        withTheme(themeName, component, additionalClasses),
      getColor: (colorKey: keyof ThemeConfig['colors']) =>
        getThemeColor(themeName, colorKey),
    }
  }, [themeName])
}

