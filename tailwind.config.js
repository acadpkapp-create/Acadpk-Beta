/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      colors: {
        // Core Palette Tokens
        primary: {
          DEFAULT: "#00321f",
          container: "#004b30",
          light: "#005c3d",
          dark: "#002013",
        },
        "on-primary": "#ffffff",
        "on-primary-container": "#7bba97",
        
        secondary: {
          DEFAULT: "#006c4d",
          container: "#6df8c1",
          light: "#008f67",
          dark: "#004b34",
        },
        "on-secondary": "#ffffff",
        "on-secondary-container": "#007150",

        // Background & Surface Tokens
        background: "#f7f9fb",
        "on-background": "#191c1e",
        surface: "#f7f9fb",
        "on-surface": "#191c1e",
        "surface-variant": "#e0e3e5",
        "on-surface-variant": "#404943",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",

        // Glassmorphism & Translucency Tokens
        "surface-glass": "rgba(255, 255, 255, 0.75)",
        "surface-glass-dark": "rgba(25, 28, 30, 0.75)",
        "border-glass": "rgba(255, 255, 255, 0.4)",
        "border-glass-dark": "rgba(255, 255, 255, 0.1)",

        // Border & Outline Tokens
        outline: "#707972",
        "outline-variant": "#bfc9c1",

        // Inverse Theme Tokens
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
        "inverse-primary": "#94d4b0",

        // Functional Status Colors
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#410002",
        success: "#006e36",
        "success-container": "#9bf6b1",
        warning: "#7c5800",
        "warning-container": "#ffdea1",
      },

      spacing: {
        gutter: "24px",
        "margin-mobile": "16px",
        "margin-desktop": "40px",
        "container-max": "1440px",
        18: "4.5rem",
        88: "22rem",
        112: "28rem",
        128: "32rem",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },

      fontSize: {
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "500" }],
        "label-lg": ["16px", { lineHeight: "24px", letterSpacing: "0.01em", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-xl-mobile": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-xl": ["56px", { lineHeight: "64px", letterSpacing: "-0.025em", fontWeight: "800" }],
        "display-hero": ["64px", { lineHeight: "72px", letterSpacing: "-0.03em", fontWeight: "900" }],
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        glass: "1.25rem",
      },

      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 50, 31, 0.08)",
        "glass-hover": "0 12px 40px 0 rgba(0, 50, 31, 0.15)",
        glow: "0 0 25px -5px rgba(109, 248, 193, 0.4)",
        card: "0 4px 20px -2px rgba(25, 28, 30, 0.05)",
        "card-hover": "0 20px 40px -15px rgba(0, 50, 31, 0.12)",
      },

      backdropBlur: {
        xs: "2px",
        glass: "16px",
        "glass-heavy": "24px",
      },

      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },

      animation: {
        "fade-in": "fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-out": "fade-out 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-down": "slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulse-glow 3s infinite ease-in-out",
        float: "float 4s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};