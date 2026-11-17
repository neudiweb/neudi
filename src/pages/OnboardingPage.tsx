import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/common/States';
import { useTheme } from '../contexts/ThemeContext';

export function OnboardingPage() {
  const [businessName, setBusinessName] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { createBusiness } = useAuth();
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  // Success popup state
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Check if user just registered — show success popup on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const justRegistered = sessionStorage.getItem('register_success');
      if (justRegistered) {
        sessionStorage.removeItem('register_success');
        setShowSuccess(true);
      }
    }
  }, []);

  // Auto-dismiss popup and redirect to dashboard
  React.useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        navigate('/dashboard');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  const slugPreview = businessName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Ingresá el nombre del negocio.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const result = await createBusiness(businessName.trim());
    setIsSubmitting(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-surface)] to-accent-50/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Neudi</h1>
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Creá tu negocio</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl shadow-sm p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-[var(--color-danger-50)] border border-[var(--color-danger-100)] rounded-lg px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" strokeLinecap="round" />
                <path d="M12 16h.01" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="businessName"
              type="text"
              label="Nombre del negocio"
              placeholder="Peluquería Juan"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              autoComplete="organization"
            />

            {/* Slug preview */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Identificador público
              </label>
              <div className="w-full px-3 py-2 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-secondary)]">
                neudi.app/{slugPreview || 'nombre-negocio'}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                Se genera automáticamente a partir del nombre
              </p>
            </div>

            {/* Default settings */}
            <div className="space-y-2 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-primary)] rounded-lg p-3">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                Configuración por defecto
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Zona horaria</span>
                <span className="text-[var(--color-text-primary)] font-medium">America/Argentina/Buenos_Aires</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Moneda</span>
                <span className="text-[var(--color-text-primary)] font-medium">ARS ($)</span>
              </div>
            </div>

            <Button type="submit" className="w-full btn-lg" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Crear negocio'}
            </Button>
          </form>

          {/* Back to home */}
          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5" strokeLinecap="round" />
                <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Account Created Success Popup — shown when user just registered */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-sm rounded-2xl border shadow-2xl flex flex-col items-center text-center p-8 ${
              isDark ? 'border-zinc-500/20 bg-zinc-950/95' : 'border-zinc-200 bg-white/95'
            } backdrop-blur-xl`}
            style={{ animation: 'modalIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            {/* Checkmark circle */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              ¡Cuenta creada exitosamente!
            </h3>
            <p className={`text-sm leading-relaxed mb-1 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
              Tu cuenta de Neudi fue creada correctamente.
            </p>
            <p className={`text-xs leading-relaxed mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Se envió un mail de verificación a tu email.
              <br />
              Redirigiendo al dashboard...
            </p>

            {/* Progress bar */}
            <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{
                  animation: 'progressBar 2.5s linear forwards',
                }}
              />
            </div>

            <style>{`
              @keyframes modalIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
              @keyframes progressBar {
                from { width: 0%; }
                to { width: 100%; }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
