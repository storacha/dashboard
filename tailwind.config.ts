import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gray-dark': '#1d2027',
        'hot-red': '#E91315',
        'hot-red-light': '#EFE3F3',
        'hot-yellow': '#FFC83F',
        'hot-yellow-light': '#FFE4AE',
        'hot-blue': '#0176CE',
        'hot-blue-light': '#BDE0FF',
        'hot-blue-dark': '#015ba3',
      },
      fontFamily: {
        'sans': ['Epilogue', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['DM Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    }
  },
  plugins: [],
}

export default config
