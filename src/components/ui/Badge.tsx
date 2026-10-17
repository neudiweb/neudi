import * as React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variants: Record<string, string> = {
  default: 'bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]',
  success: 'bg-[var(--color-success-50)] text-[var(--color-success-700)] border border-[var(--color-success-100)]',
  warning: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)] border border-[var(--color-warning-100)]',
  danger: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border border-[var(--color-danger-100)]',
  info: 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)] border border-[var(--color-accent-200)]',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
