import * as React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/common/States';

export function RegisterPage() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !businessName.trim()) {
      setError('Completá todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const result = await register(name, email, password, businessName);
    setIsSubmitting(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-surface)] to-accent-50/30 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/#/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Neudi</h1>
          </a>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Crear tu cuenta gratuita</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl shadow-sm p-6 sm:p-8 space-y-4">
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

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="name"
              type="text"
              label="Tu nombre"
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />

            <Input
              id="businessName"
              type="text"
              label="Nombre del negocio"
              placeholder="Peluquería Juan"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />

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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <Input
              id="confirmPassword"
              type="password"
              label="Confirmar contraseña"
              placeholder="Repetí tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full btn-lg mt-2" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Crear cuenta'}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-[var(--color-text-secondary)] pt-2">
            ¿Ya tenés cuenta?{' '}
            <a href="/#/login" className="font-medium text-accent-600 hover:text-accent-700">
              Iniciar sesión
            </a>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a href="/#/" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1.5">
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
