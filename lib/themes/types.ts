export type ThemeName = 
  | 'default'
  | 'linear' 
  | 'stripe' 
  | 'notion' 
  | 'apple' 
  | 'brutalist' 
  | 'webflow'

export interface ThemeColors {
  background: string
  foreground: string
  primary: string
  secondary?: string
  accent: string
  muted: string
  border: string
  inputBg: string
  inputBorder: string
  buttonBg: string
  buttonText: string
  buttonHover: string
  success: string
  error: string
}

export interface ThemeTypography {
  fontFamily: {
    heading: string
    body: string
    mono?: string
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
    '6xl': string
    '7xl': string
  }
  fontWeight: {
    normal: string
    medium: string
    semibold: string
    bold: string
  }
}

export interface ThemeLayout {
  containerMaxWidth: string
  spacing: {
    tight: string
    normal: string
    loose: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
    full: string
  }
}

export interface ThemeAnimations {
  transitions: string
  duration: {
    fast: string
    normal: string
    slow: string
  }
  effects: string[]
}

export interface ThemeConfig {
  name: ThemeName
  displayName: string
  description: string
  colors: ThemeColors
  typography: ThemeTypography
  layout: ThemeLayout
  animations: ThemeAnimations
  classes: {
    container: string
    heading: string
    body: string
    button: string
    buttonPrimary: string
    buttonSecondary: string
    input: string
    card: string
    badge: string
  }
}

