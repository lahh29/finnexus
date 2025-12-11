// src/components/ui/index.js
'use client';

import { forwardRef } from 'react';

// ============================================
// BUTTON
// ============================================

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'default',
  loading = false,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-transparent hover:bg-secondary',
    ghost: 'hover:bg-secondary',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    success: 'bg-success text-success-foreground hover:bg-success/90',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm rounded-lg',
    default: 'h-11 px-5 rounded-xl',
    lg: 'h-12 px-6 text-lg rounded-xl',
    icon: 'h-10 w-10 rounded-xl',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
});
Button.displayName = 'Button';

// ============================================
// INPUT
// ============================================

export const Input = forwardRef(({ 
  label,
  error,
  icon,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full h-11 bg-secondary/50 border border-border/50 rounded-xl
            px-4 ${icon ? 'pl-10' : ''} text-foreground placeholder:text-muted-foreground
            outline-none focus:border-primary focus:ring-2 focus:ring-primary/10
            transition-all disabled:opacity-50
            ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});
Input.displayName = 'Input';

// ============================================
// CARD
// ============================================

export const Card = forwardRef(({ 
  children, 
  className = '',
  padding = 'default',
  ...props 
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      ref={ref}
      className={`
        bg-card rounded-2xl border border-border/50
        shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.1)]
        ${paddings[padding]} ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

// ============================================
// PROGRESS BAR
// ============================================

export function ProgressBar({ 
  value = 0, 
  max = 100, 
  size = 'default',
  color = 'primary',
  showLabel = false,
  className = '',
}) {
  const percent = Math.min((value / max) * 100, 100);
  
  const sizes = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  };

  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    auto: percent >= 100 ? 'bg-destructive' : percent >= 80 ? 'bg-warning' : 'bg-primary',
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-medium text-foreground">{Math.round(percent)}%</span>
        </div>
      )}
      <div className={`w-full bg-secondary rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[color]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// BADGE
// ============================================

export function Badge({ 
  children, 
  variant = 'default',
  size = 'default',
  className = '',
}) {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
    outline: 'border border-border bg-transparent',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    default: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${variants[variant]} ${sizes[size]} ${className}
    `}>
      {children}
    </span>
  );
}

// ============================================
// AVATAR
// ============================================

export function Avatar({ 
  src, 
  name, 
  size = 'default',
  className = '',
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    default: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div className={`
      rounded-full bg-primary/10 text-primary font-semibold
      flex items-center justify-center
      ${sizes[size]} ${className}
    `}>
      {initials}
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`bg-muted animate-pulse rounded-lg ${className}`}
      {...props}
    />
  );
}

// ============================================
// EMPTY STATE
// ============================================

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

// ============================================
// ALERT
// ============================================

export function Alert({ 
  children, 
  variant = 'default',
  icon,
  className = '',
}) {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    info: 'bg-info/10 text-info border-info/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className={`
      flex items-start gap-3 p-4 rounded-xl border
      ${variants[variant]} ${className}
    `}>
      {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}