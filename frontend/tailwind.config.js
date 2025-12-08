/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fdf4f3',
                    100: '#fce8e6',
                    200: '#f9d5d2',
                    300: '#f4b5af',
                    400: '#ec8b82',
                    500: '#e06459',
                    600: '#cc4539',
                    700: '#ab372d',
                    800: '#8e3129',
                    900: '#762e28',
                    950: '#401511',
                },
                secondary: {
                    50: '#f8f6f4',
                    100: '#efebe5',
                    200: '#ded4c9',
                    300: '#c9b7a6',
                    400: '#b29682',
                    500: '#a27f69',
                    600: '#956f5d',
                    700: '#7c5a4e',
                    800: '#664b43',
                    900: '#543f39',
                    950: '#2d201d',
                },
                gold: {
                    50: '#fbf9eb',
                    100: '#f6f1cc',
                    200: '#efe29c',
                    300: '#e5cc63',
                    400: '#dbb737',
                    500: '#cca01f',
                    600: '#b07d18',
                    700: '#8d5c17',
                    800: '#754a1a',
                    900: '#643e1b',
                    950: '#3a1f0b',
                },
            },
            fontFamily: {
                sans: ['Outfit', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
                script: ['Great Vibes', 'cursive'],
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            },
        },
    },
    plugins: [],
}
