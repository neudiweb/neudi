import * as React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/common/States';

export function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { login, loginDemo } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Completá todos los campos.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result.error) setError(result.error);
  };

  const handleDemo = async () => {
    setIsSubmitting(true);
    setError('');
    const result = await loginDemo();
    setIsSubmitting(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-surface)] to-accent-50/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Neudi</h1>
          </a>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Iniciar sesión en tu cuenta</p>
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
              id="email"
              type="email"
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div>
              <Input
                id="password"
                type="password"
                label="Contraseña"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">Mínimo 6 caracteres</p>
            </div>

            <Button type="submit" className="w-full btn-lg" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Iniciar sesión'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--color-border-primary)]" />
            <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">o</span>
            <div className="flex-1 h-px bg-[var(--color-border-primary)]" />
          </div>

          {/* Demo button */}
          <button
            type="button"
            onClick={handleDemo}
            disabled={isSubmitting}
            className="w-full btn btn-secondary btn-lg gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 8h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3" />
            </svg>
            Probar demo
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            ¿No tenés cuenta?{' '}
            <a href="/register" className="font-medium text-accent-600 hover:text-accent-700">
              Crear una cuenta
            </a>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" strokeLinecap="round" />
              <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
