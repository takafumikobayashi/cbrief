/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // プライマリーカラー #4b53bc
        primary: {
          50: '#ededf9',
          100: '#d9dbf2',
          200: '#b3b7e5',
          300: '#8d93d8',
          400: '#6c74ca',
          500: '#4b53bc', // メイン
          600: '#3c42a3',
          700: '#2e3279',
          800: '#1f2150',
          900: '#0f1028',
          950: '#080814',
        },
        // セカンダリーカラー #676778
        secondary: {
          50: '#f1f1f2',
          100: '#e3e3e6',
          200: '#c7c7cc',
          300: '#ababb3',
          400: '#8f8f99',
          500: '#676778', // メイン
          600: '#52525f',
          700: '#3e3e47',
          800: '#292930',
          900: '#151518',
          950: '#0a0a0c',
        },
      },
      fontSize: {
        base: '14pt', // PRD §7: 14pt以上
      },
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans JP',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.700'),
            fontSize: '14pt',
            lineHeight: '1.75',
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: theme('colors.primary.700'),
              },
            },
            strong: {
              color: theme('colors.gray.900'),
            },
            code: {
              color: theme('colors.secondary.600'),
              backgroundColor: theme('colors.gray.100'),
              borderRadius: '0.25rem',
              padding: '0.125rem 0.25rem',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.primary.400'),
              '&:hover': {
                color: theme('colors.primary.300'),
              },
            },
            strong: {
              color: theme('colors.gray.100'),
            },
            code: {
              color: theme('colors.secondary.400'),
              backgroundColor: theme('colors.gray.800'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
