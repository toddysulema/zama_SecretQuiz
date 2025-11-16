/**
 * Design Tokens for SecretQuiz
 * 
 * Generated from seed: sha256("SecretQuiz" + "Sepolia" + "202511" + "SecretQuiz")
 * 
 * Design System: Tech-Modern (Modern Minimalist with Tech Elements)
 * Color Palette: Deep Purple-Blue + Violet + Cyan
 * Typography: Inter (headings) + System UI Stack (body)
 * Layout: Card-based grid with glassmorphism
 * Component Style: Medium rounded corners (8-12px) + Soft shadows + Gradient accents
 * Motion: Fade + Y-axis slide (0.3s cubic-bezier(0.4, 0, 0.2, 1))
 * Density: Compact (gap-2/p-3) / Comfortable (gap-4/p-6)
 * Responsive: 768px / 1024px / 1280px
 */

export const designTokens = {
  // Color System
  colors: {
    light: {
      primary: {
        DEFAULT: '#6366F1', // Indigo-500
        50: '#EEF2FF',
        100: '#E0E7FF',
        200: '#C7D2FE',
        300: '#A5B4FC',
        400: '#818CF8',
        500: '#6366F1',
        600: '#4F46E5',
        700: '#4338CA',
        800: '#3730A3',
        900: '#312E81',
        foreground: '#FFFFFF',
      },
      secondary: {
        DEFAULT: '#8B5CF6', // Violet-500
        50: '#FAF5FF',
        100: '#F3E8FF',
        200: '#E9D5FF',
        300: '#D8B4FE',
        400: '#C084FC',
        500: '#8B5CF6',
        600: '#7C3AED',
        700: '#6D28D9',
        800: '#5B21B6',
        900: '#4C1D95',
        foreground: '#FFFFFF',
      },
      accent: {
        DEFAULT: '#06B6D4', // Cyan-500
        50: '#ECFEFF',
        100: '#CFFAFE',
        200: '#A5F3FC',
        300: '#67E8F9',
        400: '#22D3EE',
        500: '#06B6D4',
        600: '#0891B2',
        700: '#0E7490',
        800: '#155E75',
        900: '#164E63',
        foreground: '#FFFFFF',
      },
      success: '#10B981', // Emerald-500
      warning: '#F59E0B', // Amber-500
      error: '#EF4444', // Red-500
      background: '#FFFFFF',
      foreground: '#0F172A', // Slate-900
      card: '#F8FAFC', // Slate-50
      cardForeground: '#0F172A',
      border: '#E2E8F0', // Slate-200
      input: '#F1F5F9', // Slate-100
      muted: '#F1F5F9',
      mutedForeground: '#64748B', // Slate-500
    },
    dark: {
      primary: {
        DEFAULT: '#818CF8', // Indigo-400
        50: '#312E81',
        100: '#3730A3',
        200: '#4338CA',
        300: '#4F46E5',
        400: '#6366F1',
        500: '#818CF8',
        600: '#A5B4FC',
        700: '#C7D2FE',
        800: '#E0E7FF',
        900: '#EEF2FF',
        foreground: '#FFFFFF',
      },
      secondary: {
        DEFAULT: '#C084FC', // Violet-400
        50: '#4C1D95',
        100: '#5B21B6',
        200: '#6D28D9',
        300: '#7C3AED',
        400: '#8B5CF6',
        500: '#C084FC',
        600: '#D8B4FE',
        700: '#E9D5FF',
        800: '#F3E8FF',
        900: '#FAF5FF',
        foreground: '#FFFFFF',
      },
      accent: {
        DEFAULT: '#22D3EE', // Cyan-400
        50: '#164E63',
        100: '#155E75',
        200: '#0E7490',
        300: '#0891B2',
        400: '#06B6D4',
        500: '#22D3EE',
        600: '#67E8F9',
        700: '#A5F3FC',
        800: '#CFFAFE',
        900: '#ECFEFF',
        foreground: '#0F172A',
      },
      success: '#34D399', // Emerald-400
      warning: '#FBBF24', // Amber-400
      error: '#F87171', // Red-400
      background: '#0F172A', // Slate-900
      foreground: '#F1F5F9', // Slate-100
      card: '#1E293B', // Slate-800
      cardForeground: '#F1F5F9',
      border: '#334155', // Slate-700
      input: '#1E293B',
      muted: '#1E293B',
      mutedForeground: '#94A3B8', // Slate-400
    },
  },

  // Typography
  typography: {
    fontFamily: {
      heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // Spacing & Layout
  spacing: {
    compact: {
      xs: '0.25rem',  // 4px
      sm: '0.5rem',   // 8px
      md: '0.75rem',  // 12px
      lg: '1rem',     // 16px
      xl: '1.5rem',   // 24px
      '2xl': '2rem',  // 32px
    },
    comfortable: {
      xs: '0.5rem',   // 8px
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
      xl: '3rem',     // 48px
      '2xl': '4rem',  // 64px
    },
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 15px rgba(99, 102, 241, 0.5)',
    glowDark: '0 0 15px rgba(129, 140, 248, 0.5)',
  },

  // Transitions
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },

  // Glassmorphism Effect
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    backgroundDark: 'rgba(15, 23, 42, 0.8)',
    backdrop: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderDark: '1px solid rgba(255, 255, 255, 0.1)',
  },
} as const;

// CSS Variables Generator
export function generateCSSVariables(mode: 'light' | 'dark' = 'light') {
  const colors = designTokens.colors[mode];
  
  return {
    '--background': mode === 'light' ? '0 0% 100%' : '222 47% 11%',
    '--foreground': mode === 'light' ? '222 47% 11%' : '210 40% 98%',
    '--card': mode === 'light' ? '210 40% 98%' : '217 33% 17%',
    '--card-foreground': mode === 'light' ? '222 47% 11%' : '210 40% 98%',
    '--popover': mode === 'light' ? '0 0% 100%' : '217 33% 17%',
    '--popover-foreground': mode === 'light' ? '222 47% 11%' : '210 40% 98%',
    '--primary': mode === 'light' ? '239 84% 67%' : '239 84% 74%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': mode === 'light' ? '263 70% 67%' : '263 70% 75%',
    '--secondary-foreground': '0 0% 100%',
    '--muted': mode === 'light' ? '210 40% 96%' : '217 33% 17%',
    '--muted-foreground': mode === 'light' ? '215 16% 47%' : '215 20% 65%',
    '--accent': mode === 'light' ? '188 94% 43%' : '188 85% 54%',
    '--accent-foreground': mode === 'light' ? '0 0% 100%' : '222 47% 11%',
    '--destructive': mode === 'light' ? '0 84% 60%' : '0 84% 69%',
    '--destructive-foreground': '0 0% 100%',
    '--border': mode === 'light' ? '214 32% 91%' : '215 28% 33%',
    '--input': mode === 'light' ? '214 32% 95%' : '217 33% 17%',
    '--ring': mode === 'light' ? '239 84% 67%' : '239 84% 74%',
    '--radius': '0.75rem',
  };
}

// Utility: Get color with opacity
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Utility: Get spacing value
export function getSpacing(size: keyof typeof designTokens.spacing.compact, density: 'compact' | 'comfortable' = 'comfortable'): string {
  return designTokens.spacing[density][size];
}

// Utility: Create transition string
export function createTransition(property: string | string[], duration: keyof typeof designTokens.transitions.duration = 'normal'): string {
  const props = Array.isArray(property) ? property.join(', ') : property;
  return `${props} ${designTokens.transitions.duration[duration]} ${designTokens.transitions.easing.default}`;
}

