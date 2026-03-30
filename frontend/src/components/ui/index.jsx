/**
 * components/ui/index.jsx
 * Reusable primitive components following the "Modern Riad" design system.
 */

import { forwardRef } from 'react'
import { X } from 'lucide-react'

// ── Button ────────────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-headline font-semibold rounded-full transition-all duration-300 ease-premium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-primary text-on-primary hover:bg-primary-container hover:shadow-ambient-md',
    secondary: 'bg-secondary-container text-on-secondary-container hover:brightness-105 hover:shadow-amber',
    ghost:     'text-primary border border-transparent hover:border-primary/20 hover:bg-primary/5 dark:text-primary-fixed dark:hover:border-primary-fixed/20 dark:hover:bg-primary-fixed/5',
    danger:    'bg-error-container text-on-error-container hover:brightness-105',
    outline:   'border border-outline/30 text-on-surface dark:text-white/80 hover:bg-surface-container dark:hover:bg-white/5',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────
export const Input = forwardRef(function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-on-surface dark:text-white/80">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/40">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            input-field dark:bg-dark-surface-container dark:text-white/90 dark:placeholder:text-white/30
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-error/50 bg-error-container/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined" style={{fontSize:14}}>error</span>{error}</p>}
    </div>
  )
})

// ── Select ────────────────────────────────────────────────────
export const Select = forwardRef(function Select({
  label,
  error,
  options = [],
  placeholder,
  className = '',
  ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-on-surface dark:text-white/80">{label}</label>}
      <select
        ref={ref}
        className={`input-field dark:bg-dark-surface-container dark:text-white/90 ${error ? 'border-error/50' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
})

// ── Textarea ──────────────────────────────────────────────────
export const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-on-surface dark:text-white/80">{label}</label>}
      <textarea
        ref={ref}
        rows={4}
        className={`input-field resize-none dark:bg-dark-surface-container dark:text-white/90 ${error ? 'border-error/50' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
})

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`
        bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient p-6
        ${hover ? 'transition-all duration-300 ease-premium hover:shadow-ambient-md hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default:  'bg-surface-container text-on-surface-variant dark:bg-white/10 dark:text-white/70',
    primary:  'bg-primary/10 text-primary dark:bg-primary-fixed/10 dark:text-primary-fixed',
    amber:    'bg-secondary-container/30 text-secondary dark:bg-secondary-container/20 dark:text-secondary-container',
    success:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    danger:   'bg-error-container text-on-error-container dark:bg-red-900/30 dark:text-red-400',
    public:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    private:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    semipublic: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} rounded-full border-2 border-primary/20 border-t-primary animate-spin ${className}`} />
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative w-full ${maxWidth} bg-surface-container-lowest dark:bg-dark-surface-container rounded-3xl shadow-ambient-lg p-6 animate-fade-up`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-headline font-bold text-lg text-on-surface dark:text-white/90">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Alert / Toast message ─────────────────────────────────────
export function Alert({ type = 'info', message, className = '' }) {
  if (!message) return null
  const styles = {
    error:   'bg-error-container text-on-error-container dark:bg-red-900/30 dark:text-red-300',
    success: 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    info:    'bg-primary/5 text-primary dark:bg-primary-fixed/10 dark:text-primary-fixed',
    warning: 'bg-secondary-container/20 text-secondary dark:text-secondary-container',
  }
  const icons = { error: 'error', success: 'check_circle', info: 'info', warning: 'warning' }
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm ${styles[type]} ${className}`}>
      <span className="material-symbols-outlined" style={{fontSize:18}}>{icons[type]}</span>
      <span>{message}</span>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-surface-container dark:bg-white/5 flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-on-surface-variant dark:text-white/30" style={{fontSize:32}}>{icon}</span>
      </div>
      <div className="space-y-1.5">
        <p className="font-headline font-semibold text-on-surface dark:text-white/80">{title}</p>
        {description && <p className="text-sm text-on-surface-variant dark:text-white/40 max-w-xs mx-auto">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Page header ───────────────────────────────────────────────
export function PageHeader({ label, title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div className="space-y-2">
        {label && <p className="section-label">{label}</p>}
        <h1 className="font-headline font-bold text-3xl text-on-surface dark:text-white/90">{title}</h1>
        {subtitle && <p className="text-on-surface-variant dark:text-white/50 max-w-xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────
export function StatCard({ icon, label, value, trend, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary/10 text-primary dark:bg-primary-fixed/10 dark:text-primary-fixed',
    amber:   'bg-secondary-container/30 text-secondary dark:text-secondary-container',
    green:   'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    blue:    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  }
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <span className="material-symbols-outlined icon-md">{icon}</span>
        </div>
        {trend && <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      <div>
        <p className="text-2xl font-headline font-bold text-on-surface dark:text-white/90">{value}</p>
        <p className="text-sm text-on-surface-variant dark:text-white/40 mt-0.5">{label}</p>
      </div>
    </Card>
  )
}
