import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlowingCard, FloatingLogo, ShimmerButton, PulseDot } from '@/components/auth/AuthVisuals';
import { Modal } from '@/components/ui/Modal';

/* ===========================
   MAIN LOGIN PAGE
   =========================== */

export function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetSent, setResetSent] = React.useState(false);
  const [resetError, setResetError] = React.useState('');
  const [isResetting, setIsResetting] = React.useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Completá todos los campos.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    
    // Direct Supabase call for immediate error feedback
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    setIsSubmitting(false);
    
    if (authError) {
      console.log('Login error:', authError);
      let msg = 'Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.';
      if (authError.code === 'invalid_credentials') {
        msg = 'Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.';
      } else if (authError.code === 'email_not_confirmed') {
        msg = 'Email aún no autenticado. Por favor verifique su correo electrónico.';
      } else if (authError.code === 'rate_limit') {
        msg = 'Demasiados intentos. Esperá un momento e intentá de nuevo.';
      } else if (authError.message?.includes('not found')) {
        msg = 'No se encontró una cuenta con ese email.';
      } else if (authError.message?.includes('Invalid')) {
        msg = 'Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.';
      }
      setError(msg);
      return;
    }
    
    navigate('/dashboard/agenda');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Ingresá tu email.');
      return;
    }
    setIsResetting(true);
    setResetError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const data = await response.json();
      setIsResetting(false);

      if (!response.ok || data.error) {
        setResetError('No se pudo verificar el email.');
        return;
      }

      if (!data.exists) {
        setResetError('Ese email no está registrado en Neudi.');
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/neudi/reset-password`,
      });

      if (resetError) {
        setResetError('No se pudo enviar el correo de recuperación.');
        return;
      }

      setResetSent(true);
    } catch {
      setIsResetting(false);
      setResetError('Error de red. Verificá tu conexión.');
    }
  };

  return (
    <AuthLayout after={showResetModal && (
        <Modal
          shellClassName="fixed inset-0 z-50 flex items-center justify-center px-4"
          testId="reset-modal"
          backdropClassName="absolute inset-0 bg-black/50 backdrop-blur-sm"
          backdropTestId="reset-modal-backdrop"
          onBackdropClick={() => { setShowResetModal(false); setResetSent(false); setResetError(''); }}
          panelClassName={`relative w-full max-w-sm rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all duration-300 ${isDark ? 'border-emerald-500/20 bg-emerald-950/30 backdrop-blur-xl' : 'border-emerald-200 bg-white/95 backdrop-blur-xl'}`}
          panelStyle={{ animation: 'modalIn 0.3s ease-out' }}
        >
            <style>{`
              @keyframes modalIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>

            {resetSent ? (
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={` ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                    <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  Email enviado
                </h3>
                <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'}`}>
                  Te enviamos un enlace para recuperar tu contraseña a <strong className={`font-semibold ${isDark ? 'text-emerald-200' : 'text-zinc-700'}`}>{resetEmail}</strong>. Revisá tu bandeja de entrada.
                </p>
                <button
                  onClick={() => { setShowResetModal(false); setResetSent(false); setResetError(''); }}
                  className={`w-full rounded-xl border-2 px-6 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                    isDark
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10'
                      : 'border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100/70'
                  }`}
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <button
                  data-testid="reset-modal-close"
                  onClick={() => { setShowResetModal(false); setResetSent(false); setResetError(''); }}
                  className={`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 ${isDark ? 'text-emerald-200/40 hover:text-emerald-200/80 hover:bg-emerald-500/10' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="mb-5">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Recuperar contraseña
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-emerald-200/50' : 'text-zinc-500'}`}>
                    Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.
                  </p>
                </div>

                {resetError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl px-4 py-3 mb-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" strokeLinecap="round" />
                      <path d="M12 16h.01" strokeLinecap="round" />
                    </svg>
                    {resetError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-emerald-100/80' : 'text-zinc-700'}`}>
                      Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="tu@email.com"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleReset(e as unknown as React.FormEvent); }}
                      autoFocus
                      className={`w-full rounded-xl border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 ${isDark ? 'border-emerald-500/20 hover:border-emerald-500/30' : 'border-emerald-200 hover:border-emerald-300'}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleReset(e as unknown as React.FormEvent); }}
                    disabled={isResetting}
                    className={`group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-9 py-4 text-lg font-bold text-white shadow-2xl shadow-emerald-500/25 transition-all duration-500 hover:shadow-emerald-500/40 hover:scale-105 active:scale-100 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full`}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    <span className="relative z-10">
                      {isResetting ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Enviando...
                        </span>
                      ) : (
                        'Enviar enlace'
                      )}
                    </span>
                  </button>
                </div>
              </>
            )}
        </Modal>
      )}>

          {/* Logo + Title */}
          <div
            className="text-center mb-10 transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            }}
          >
            <div className="flex justify-center mb-6">
              <FloatingLogo />
            </div>
            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'} mb-2`}
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
              Bienvenido a{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                Neudi
              </span>
            </h1>
            <p className={`text-sm ${isDark ? 'text-emerald-200/50' : 'text-zinc-500'} transition-colors duration-700`}>
              Iniciar sesión en tu cuenta
            </p>
          </div>

          {/* Card */}
          <GlowingCard>
            <div
              className={`relative rounded-2xl border p-6 sm:p-8 transition-all duration-1000 ${isDark ? 'border-emerald-500/20 bg-emerald-950/20 backdrop-blur-xl' : 'border-emerald-300/50 bg-white/80 backdrop-blur-xl'}`}
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className={`absolute -top-24 right-0 w-48 h-48 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-200/40'} rounded-full blur-3xl`} />
                <div className={`absolute -bottom-24 left-0 w-48 h-48 ${isDark ? 'bg-teal-500/10' : 'bg-teal-200/40'} rounded-full blur-3xl`} />
              </div>

              <div className="relative">
                {/* Error message */}
                {error && (
                  <div
                    className="flex items-start gap-2.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl px-4 py-3 mb-5 backdrop-blur-sm"
                    style={{
                      opacity: loaded ? 1 : 0,
                      transition: 'all 0.5s ease 0.3s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" strokeLinecap="round" />
                      <path d="M12 16h.01" strokeLinecap="round" />
                    </svg>
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div
                    style={{
                      opacity: loaded ? 1 : 0,
                      transform: loaded ? 'translateY(0)' : 'translateY(15px)',
                      transition: 'all 0.6s ease 0.3s',
                    }}
                  >
                    <label htmlFor="email" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-emerald-100/80' : 'text-zinc-700'}`}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className={`w-full rounded-xl border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 ${isDark ? 'border-emerald-500/20 hover:border-emerald-500/30' : 'border-emerald-200 hover:border-emerald-300'}`}
                    />
                  </div>

                  {/* Password */}
                  <div
                    style={{
                      opacity: loaded ? 1 : 0,
                      transform: loaded ? 'translateY(0)' : 'translateY(15px)',
                      transition: 'all 0.6s ease 0.4s',
                    }}
                  >
                    <label htmlFor="password" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-emerald-100/80' : 'text-zinc-700'}`}>
                      Contraseña
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className={`w-full rounded-xl border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 ${isDark ? 'border-emerald-500/20 hover:border-emerald-500/30' : 'border-emerald-200 hover:border-emerald-300'}`}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${isDark ? 'text-emerald-200/40' : 'text-zinc-400'}`}>Mínimo 6 caracteres</p>
                      <button
                        type="button"
                        onClick={() => { setShowResetModal(true); setResetSent(false); setResetError(''); }}
                        className={`text-xs font-medium transition-colors duration-200 ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <div
                    style={{
                      opacity: loaded ? 1 : 0,
                      transform: loaded ? 'translateY(0)' : 'translateY(15px)',
                      transition: 'all 0.6s ease 0.5s',
                    }}
                  >
                    <ShimmerButton onClick={(e) => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }} disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Iniciando sesión...
                        </span>
                      ) : (
                        <>
                          Iniciar sesión
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10 transition-transform duration-500 group-hover:translate-x-1.5">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </>
                      )}
                    </ShimmerButton>
                  </div>
                </form>

                {/* Register link */}
                <div
                  className="text-center mt-6"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.6s ease 0.75s',
                  }}
                >
                  <p className={`text-sm ${isDark ? 'text-emerald-200/50' : 'text-zinc-500'}`}>
                    ¿No tenés cuenta?{' '}
                    <Link
                      to="/register"
                      className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hover:from-emerald-500 hover:to-teal-500 transition-all duration-300"
                    >
                      Crear una cuenta
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </GlowingCard>

          {/* Back to home */}
          <div
            className="text-center mt-8"
            style={{
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.6s ease 0.85s',
            }}
          >
            <Link
              to="/"
              className={`text-sm inline-flex items-center gap-1.5 transition-colors duration-300 ${isDark ? 'text-emerald-200/40 hover:text-emerald-200/70' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5" strokeLinecap="round" />
                <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver al inicio
            </Link>
          </div>

          {/* Trust indicators */}
          <div
            className={`mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs ${isDark ? 'text-emerald-200/30' : 'text-zinc-400'}`}
            style={{
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.6s ease 0.95s',
            }}
          >
            {['Sin complicaciones', 'Configuración en 5 min', '100% online'].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <PulseDot />
                {item}
              </span>
            ))}
          </div>
    </AuthLayout>
  );
}
