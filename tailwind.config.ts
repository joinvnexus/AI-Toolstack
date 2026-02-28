import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6366F1',
          secondary: '#10B981',
          accent: '#8B5CF6',
          background: '#0F0F0F',
          surface: '#1A1A1A',
          text: '#F9FAFB',
          muted: '#9CA3AF'
        }
      }
    }
  },
  plugins: []
};

export default config;
