import * as React from 'react';

export function Input({ label, error, id, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
          {label}
        </label>
      )}
      <input id={id} {...props} className={`rounded-lg border bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/30 ${error ? 'border-red-400' : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-strong)]'} ${className}`} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, id, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
          {label}
        </label>
      )}
      <textarea id={id} {...props} className={`rounded-lg border bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/30 resize-y min-h-[80px] ${error ? 'border-red-400' : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-strong)]'} ${className}`} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
