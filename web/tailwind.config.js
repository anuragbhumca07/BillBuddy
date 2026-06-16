export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#7C3AED',
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '12px', btn: '8px' },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 2px 6px rgba(0,0,0,0.08)',
        lg: '0 4px 12px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
