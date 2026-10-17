import * as React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/common/States';

export function OnboardingPage() {
  const [businessName, setBusinessName] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { createBusiness } = useAuth();

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
    </div>
  );
}
