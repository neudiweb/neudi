import * as React from 'react';

interface StatesProps {
  type: 'loading' | 'empty' | 'error';
  message?: string;
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`animate-spin border-2 border-[var(--color-border-primary)] border-t-accent-500 rounded-full ${sizeClasses[size]}`} />
    </div>
  );
}

export default function States({ type, message }: StatesProps) {
  const defaultMessages = {
    loading: 'Cargando...',
    empty: 'No hay resultados para mostrar',
    error: 'Algo salió mal',
  };

  if (type === 'loading') {
    return <LoadingSpinner />;
  }

  if (type === 'empty') {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" strokeLinecap="round" />
            <path d="M8 2v4" strokeLinecap="round" />
            <path d="M3 10h18" strokeLinecap="round" />
          </svg>
        </div>
        <p className="empty-state-title">{defaultMessages.empty}</p>
        <p className="empty-state-desc">{message || defaultMessages.empty}</p>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="error-state">
        <div className="error-state-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-500)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
          </svg>
        </div>
        <p className="error-state-title">{defaultMessages.error}</p>
        <p className="error-state-desc">{message || defaultMessages.error}</p>
      </div>
    );
  }

  return null;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" strokeLinecap="round" />
          <path d="M8 2v4" strokeLinecap="round" />
          <path d="M3 10h18" strokeLinecap="round" />
        </svg>
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-500)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
        </svg>
      </div>
      <p className="error-state-title">{title}</p>
      <p className="error-state-desc">{description}</p>
    </div>
  );
}
