/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "on-background": "#f0e0d1",
        "primary-container": "#f59e0b",
        "on-tertiary-fixed": "#001e2d",
        "tertiary-fixed": "#c5e7ff",
        "on-secondary-container": "#b9b8bc",
        "on-primary-container": "#613b00",
        "background": "#1a1a1a",
        "surface-container": "#202124",
        "on-error": "#690005",
        "outline": "#35363a",
        "on-secondary-fixed": "#1a1b1e",
        "surface-container-low": "#1a1a1a",
        "primary": "#f59e0b",
        "on-surface-variant": "#c4c4c4",
        "surface": "#26272B",
        "surface-tint": "#ffb95f",
        "primary-fixed": "#ffddb8",
        "secondary-fixed": "#e3e2e6",
        "on-tertiary-container": "#004966",
        "on-surface": "#f5f5f5",
        "on-tertiary-fixed-variant": "#004c6a",
        "tertiary-fixed-dim": "#7fd0ff",
        "inverse-primary": "#855300",
        "on-primary": "#1a1a1a",
        "inverse-surface": "#f0e0d1",
        "outline-variant": "#35363a",
        "error-container": "#93000a",
        "secondary-fixed-dim": "#c7c6ca",
        "inverse-on-surface": "#382f25",
        "on-primary-fixed": "#2a1700",
        "surface-bright": "#41382e",
        "secondary-container": "#26272B",
        "on-secondary": "#f5f5f5",
        "surface-container-high": "#26272B",
        "on-error-container": "#ffdad6",
        "surface-container-highest": "#3c3329",
        "on-secondary-fixed-variant": "#46474a",
        "on-tertiary": "#00344a",
        "surface-container-lowest": "#140d06",
        "tertiary-container": "#1abdff",
        "primary-fixed-dim": "#ffb95f",
        "surface-dim": "#19120a",
        "tertiary": "#8fd5ff",
        "on-primary-fixed-variant": "#653e00",
        "secondary": "#c7c6ca",
        "error": "#ffb4ab",
        "surface-variant": "#202124"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "base": "4px",
        "container-max": "1280px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "gutter": "20px",
        "xs": "4px",
        "xl": "48px"
      },
      "fontFamily": {
        "label-md": ["Inter", "sans-serif"],
        "code-md": ["JetBrains Mono", "monospace"],
        "display-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "code-sm": ["JetBrains Mono", "monospace"],
        "headline-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "display-lg-mobile": ["Inter", "sans-serif"]
      },
      "fontSize": {
        "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.02em", "fontWeight": "500" }],
        "code-md": ["14px", { "lineHeight": "22px", "fontWeight": "400" }],
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "code-sm": ["12px", { "lineHeight": "18px", "fontWeight": "400" }],
        "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "display-lg-mobile": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700" }]
      }
    }
  }
}
