import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'gradient': 'gradient 8s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': '0% 50%'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': '100% 50%'
          }
        },
        'gradient-shift': {
          '0%, 100%': {
            transform: 'translate(0, 0) rotate(0deg)'
          },
          '25%': {
            transform: 'translate(10px, -10px) rotate(1deg)'
          },
          '50%': {
            transform: 'translate(-5px, 5px) rotate(-1deg)'
          },
          '75%': {
            transform: 'translate(-10px, -5px) rotate(1deg)'
          }
        }
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    themes: [
      {
        designer: {
          "primary": "#635BFF",    // Stripe's primary purple
          "secondary": "#0A2540",  // Stripe's dark blue
          "accent": "#00D4FF",     // Stripe's bright blue
          "neutral": "#425466",    // Stripe's medium gray
          "base-100": "#FFFFFF",   // White background
          "base-200": "#F6F9FC",   // Stripe's light gray background
          "base-300": "#E6EBF1",   // Slightly darker gray
          "base-content": "#0A2540", // Dark blue text
          "info": "#635BFF",       // Purple for info
          "success": "#32D583",    // Stripe's green
          "warning": "#FFA600",    // Stripe's orange
          "error": "#FF4242",      // Stripe's red
        },
      },
    ],
  },
}

export default config