/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:                    '#00342b',
        'primary-container':        '#004d40',
        'primary-fixed':            '#afefdd',
        'primary-fixed-dim':        '#94d3c1',
        'on-primary':               '#ffffff',
        'on-primary-container':     '#7ebdac',
        'on-primary-fixed':         '#00201a',
        'on-primary-fixed-variant': '#065043',
        'inverse-primary':          '#94d3c1',
        'surface-tint':             '#29695b',

        secondary:                  '#785900',
        'secondary-container':      '#fdc003',
        'secondary-fixed':          '#ffdf9e',
        'secondary-fixed-dim':      '#fabd00',
        'on-secondary':             '#ffffff',
        'on-secondary-container':   '#6c5000',
        'on-secondary-fixed':       '#261a00',
        'on-secondary-fixed-variant':'#5b4300',

        tertiary:                   '#735c00',
        'tertiary-container':       '#cca730',
        'tertiary-fixed':           '#ffe088',
        'tertiary-fixed-dim':       '#e9c349',
        'on-tertiary':              '#ffffff',
        'on-tertiary-container':    '#4f3e00',
        'on-tertiary-fixed':        '#241a00',
        'on-tertiary-fixed-variant':'#574500',

        surface:                    '#f8f9fa',
        'surface-dim':              '#d9dadb',
        'surface-bright':           '#f8f9fa',
        'surface-variant':          '#e1e3e4',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#f3f4f5',
        'surface-container':        '#edeeef',
        'surface-container-high':   '#e7e8e9',
        'surface-container-highest':'#e1e3e4',
        'on-surface':               '#191c1d',
        'on-surface-variant':       '#3f4945',
        'inverse-surface':          '#2e3132',
        'inverse-on-surface':       '#f0f1f2',

        background:                 '#f8f9fa',
        'on-background':            '#191c1d',

        outline:                    '#707975',
        'outline-variant':          '#bfc9c4',

        error:                      '#ba1a1a',
        'error-container':          '#ffdad6',
        'on-error':                 '#ffffff',
        'on-error-container':       '#93000a',

        // Dark mode surface tokens
        'dark-surface':             '#0f1a18',
        'dark-surface-container':   '#1a2623',
        'dark-surface-container-high': '#212e2b',
        'dark-on-surface':          '#e1e3e2',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body:     ['Inter', 'sans-serif'],
        label:    ['Inter', 'sans-serif'],
        arabic:   ['IBM Plex Sans Arabic', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md:  '0.375rem',
        lg:  '0.5rem',
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full:'9999px',
      },
      boxShadow: {
        'ambient': '0 32px 64px -15px rgba(0,52,43,0.06)',
        'ambient-md': '0 24px 48px -12px rgba(0,52,43,0.09)',
        'ambient-lg': '0 40px 80px -20px rgba(0,52,43,0.12)',
        'amber': '0 20px 40px -10px rgba(253,192,3,0.25)',
      },
      backgroundImage: {
        'zellige': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l15 15-15 15-15-15L30 0zm0 60l15-15-15-15-15 15 15 15z' fill='%2300342b' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        'zellige-amber': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l15 15-15 15-15-15L30 0zm0 60l15-15-15-15-15 15 15 15z' fill='%23fdc003' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}
