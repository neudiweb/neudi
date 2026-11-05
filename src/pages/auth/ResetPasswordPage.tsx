import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

function GlowOrb({ className }: { className?: string }) {
  return <div className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl animate-aurora-1" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-500/15 via-green-500/10 to-transparent blur-3xl animate-aurora-2" />
      <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-emerald-500/10 via-lime-500/5 to-transparent blur-3xl animate-aurora-3" />
    </div>
  );
}

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.03] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
      }}
    />
  );
}

function GlowingCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.15), transparent 40%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

function extractTokenFromHash(): { access_token: string; refresh_token: string } | null {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  
  if (accessToken && refreshToken) {
    return { access_token: accessToken, refresh_token: refreshToken };
  }
  
  return null;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [sessionValid, setSessionValid] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    async function init() {
      const tokens = extractTokenFromHash();
      
      if (tokens) {
        const { data, error } = await supabase.auth.setSession(tokens);
        
        if (error || !data.session) {
          setChecking(false);
          setError('El enlace expiró o es inválido. Solicitá uno nuevo desde el login.');
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setChecking(false);
        setError('El enlace expiró o es inválido. Solicitá uno nuevo desde el login.');
        return;
      }

      setSessionValid(true);
      setChecking(false);
    }

    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Ingresá una contraseña.');
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

    setIsUpdating(true);

    const { error } = await supabase.auth.updateUser({ password });

    setIsUpdating(false);

    if (error) {
      setError('No se pudo actualizar la contraseña. Solicitá un nuevo enlace.');
      return;
    }

    setSuccess(true);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-700 ${isDark ? 'bg-zinc-950' : 'bg-gradient-to-br from-emerald-100 via-white to-teal-100'}`}>
      <NoiseOverlay />
      <AuroraBackground />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div
            className="text-center mb-10 transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            }}
          >
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/30">
                <span className="text-3xl font-black text-white">N</span>
              </div>
            </div>
            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'} mb-2`}
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
              Neudi
            </h1>
            <p className={`text-sm ${isDark ? 'text-emerald-200/50' : 'text-zinc-500'}`}>
              {success ? 'Contraseña actualizada' : 'Crear nueva contraseña'}
            </p>
          </div>

          <GlowingCard>
            <div
              className={`relative rounded-2xl border p-6 sm:p-8 transition-all duration-1000 ${isDark ? 'border-emerald-500/20 bg-emerald-950/20 backdrop-blur-xl' : 'border-emerald-300/50 bg-white/80 backdrop-blur-xl'}`}
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
              }}
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className={`absolute -top-24 right-0 w-48 h-48 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-200/40'} rounded-full blur-3xl`} />
                <div className={`absolute -bottom-24 left-0 w-48 h-48 ${isDark ? 'bg-teal-500/10' : 'bg-teal-200/40'} rounded-full blur-3xl`} />
              </div>

              <div className="relative">
                {checking ? (
                  <div className="text-center py-8">
                    <svg className="animate-spin h-8 w-8 mx-auto text-emerald-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className={`text-sm mt-4 ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'}`}>
                      Verificando enlace...
                    </p>
                  </div>
                ) : success ? (
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                        <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      ¡Contraseña actualizada!
                    </h3>
                    <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'}`}>
                      Tu contraseña fue actualizada correctamente. Ya podés iniciar sesión.
                    </p>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/25"
                    >
                      Ir al login
                    </button>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="flex items-start gap-2.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl px-4 py-3 mb-4">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" strokeLinecap="round" />
                          <path d="M12 16h.01" strokeLinecap="round" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}

                    {sessionValid && (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="password" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-emerald-100/80' : 'text-zinc-700'}`}>
                            Nueva contraseña
                          </label>
                          <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tu nueva contraseña"
                            autoComplete="new-password"
                            className={`w-full rounded-xl border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 ${isDark ? 'border-emerald-500/20 hover:border-emerald-500/30' : 'border-emerald-200 hover:border-emerald-300'}`}
                          />
                        </div>

                        <div>
                          <label htmlFor="confirm-password" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-emerald-100/80' : 'text-zinc-700'}`}>
                            Confirmar contraseña
                          </label>
                          <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repetí tu contraseña"
                            autoComplete="new-password"
                            className={`w-full rounded-xl border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 ${isDark ? 'border-emerald-500/20 hover:border-emerald-500/30' : 'border-emerald-200 hover:border-emerald-300'}`}
                          />
                        </div>

                        {error && (
                          <div className="flex items-start gap-2.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl px-4 py-3">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v4" strokeLinecap="round" />
                              <path d="M12 16h.01" strokeLinecap="round" />
                            </svg>
                            <span>{error}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-9 py-4 text-lg font-bold text-white shadow-2xl shadow-emerald-500/25 transition-all duration-500 hover:shadow-emerald-500/40 hover:scale-105 active:scale-100 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                          <span className="relative z-10">
                            {isUpdating ? (
                              <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Actualizando...
                              </span>
                            ) : (
                              'Actualizar contraseña'
                            )}
                          </span>
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </GlowingCard>

          <div
            className="text-center mt-8"
            style={{
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.6s ease 0.85s',
            }}
          >
            <button
              onClick={() => navigate('/login')}
              className={`text-sm inline-flex items-center gap-1.5 transition-colors duration-300 ${isDark ? 'text-emerald-200/40 hover:text-emerald-200/70' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5" strokeLinecap="round" />
                <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver al login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
