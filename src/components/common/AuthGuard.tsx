import * as React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './States';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, onboardingRequired } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user && !onboardingRequired) {
    window.location.href = '/login';
    return null;
  }

  if (onboardingRequired) {
    window.location.href = '/onboarding';
    return null;
  }

  return <>{children}</>;
}

export function PlanGuard({ children }: { children: React.ReactNode }) {
  const { hasProAccess, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasProAccess) {
    return <FreeAccessScreen />;
  }

  return <>{children}</>;
}

function FreeAccessScreen() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-surface)] to-accent-50/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Neudi</h1>
          </a>
        </div>

        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-500/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Tu cuenta todavía no está activada
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                Tu cuenta fue creada correctamente, pero todavía no tiene acceso a Neudi.
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Contactá al equipo de Neudi para activar tu acceso.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                logout();
              }}
              className="w-full text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center justify-center gap-1.5 py-2 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, onboardingRequired } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Authenticated users with businesses go to dashboard, others to onboarding
  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  if (onboardingRequired) {
    window.location.href = '/onboarding';
    return null;
  }

  return <>{children}</>;
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, onboardingRequired } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Users with businesses go to dashboard
  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  // Only show onboarding for users who need it
  if (!onboardingRequired) {
    window.location.href = '/dashboard';
    return null;
  }

  return <>{children}</>;
}
