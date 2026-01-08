import { extendTheme } from '@mui/joy/styles';

// Joy UI theme that complements the Material theme
export const joyTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1a365d',
          800: '#102a43',
          900: '#0c1929',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#059669',
          600: '#047857',
          700: '#065f46',
          800: '#064e3b',
          900: '#022c22',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontWeight: 600,
        },
      },
    },
    JoyInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
        },
      },
    },
    JoyTextarea: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
        },
      },
    },
    JoySelect: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
        },
      },
    },
    JoyCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
    JoySheet: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
    JoyModal: {
      styleOverrides: {
        root: {
          '--ModalDialog-radius': '16px',
        },
      },
    },
  },
});
