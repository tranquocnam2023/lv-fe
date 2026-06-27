export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
        yellow: 'var(--color-yellow)',
        bg: 'var(--color-bg)',
        text: 'var(--color-text)',
        textmuted: 'var(--color-textmuted)',
        textmain: 'var(--color-textmain)',
        bgcard: 'var(--color-bgcard)',
        bordercustom: 'var(--color-bordercustom)',
        headerbg: 'var(--color-headerbg)',
        footerbg: 'var(--color-footerbg)',
        sidebarbg: 'var(--color-sidebarbg)',
        'admin-sidebar-bg': 'var(--color-admin-sidebar-bg)',
        'admin-sidebar-border': 'var(--color-admin-sidebar-border)',
        'admin-sidebar-hover': 'var(--color-admin-sidebar-hover)',
        'admin-sidebar-text': 'var(--color-admin-sidebar-text)',
        'admin-bg': 'var(--color-admin-bg)',
        'admin-border': 'var(--color-admin-border)',
        'admin-text-main': 'var(--color-admin-text-main)',
        'admin-text-muted': 'var(--color-admin-text-muted)',
        'admin-danger': 'var(--color-admin-danger)',
        'admin-primary-hover': 'var(--color-admin-primary-hover)',
      }
    },
  },
  plugins: [],
}