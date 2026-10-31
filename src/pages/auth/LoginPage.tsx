import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

/* ===========================
   ANIMATED BACKGROUND COMPONENTS
   =========================== */

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

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-emerald-400/15 dark:bg-emerald-300/10 animate-float-slow"
          style={{
            left: `${(i * 7.3) % 100}%`,
            top: `${(i * 11.7) % 100}%`,
            width: `${2 + (i % 5)}px`,
            height: `${2 + (i % 5)}px`,
            animationDelay: `${(i % 8)}s`,
            animationDuration: `${10 + (i % 10)}s`,
          }}
        />
      ))}
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

/* ─── Floating Logo Badge ─── */
function FloatingLogo() {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className="relative perspective-1000"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="transition-transform duration-500 ease-out"
        style={{
          transform: hovered ? 'rotateY(10deg) scale(1.05)' : 'rotateY(0) scale(1)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/30 transition-all duration-500 hover:rotate-6 hover:scale-110">
          <span className="text-3xl font-black text-white">N</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Glowing Border Card ─── */
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

/* ─── Shimmer Button ─── */
function ShimmerButton({ children, onClick, className = '', disabled = false }: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-9 py-4 text-lg font-bold text-white shadow-2xl shadow-emerald-500/25 transition-all duration-500 hover:shadow-emerald-500/40 hover:scale-105 active:scale-100 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

/* ─── Pulse Dot ─── */
function PulseDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
    </span>
  );
}

/* ─── Theme Toggle ─── */
function ThemeToggle() {
  const { activeTheme, setMode } = useTheme();
  const isDark = activeTheme === 'dark';

  return (
    <button
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-zinc-300/50 dark:border-zinc-700/50 bg-white/90 dark:bg-zinc-900/90 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-lg shadow-zinc-500/5 dark:shadow-zinc-500/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-pointer"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        {isDark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
      <span className="text-xs">{isDark ? '☀️ Claro' : '🌙 Oscuro'}</span>
    </button>
  );
}

/* ===========================
   MAIN LOGIN PAGE
   =========================== */

export function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const { login, loginDemo } = useAuth();
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
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result.error) setError(result.error);
    else navigate('/dashboard/agenda');
  };

  const handleDemo = async () => {
    setIsSubmitting(true);
    setError('');
    const result = await loginDemo();
    setIsSubmitting(false);
    if (result.error) setError(result.error);
    else navigate('/dashboard/agenda');
  };

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-700 ${isDark ? 'bg-zinc-950' : 'bg-gradient-to-br from-emerald-100 via-white to-teal-100'}`}>
      <NoiseOverlay />
      <ThemeToggle />
      <AuroraBackground />
      <ParticleField />

      {/* Grid overlay */}
      <div
        className={`absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none`}
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          animation: 'gridMove 20s linear infinite',
        }}
      />

      {/* Main content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
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
                    className="flex items-center gap-2 text-sm text-red-500 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 mb-5 backdrop-blur-sm"
                    style={{
                      opacity: loaded ? 1 : 0,
                      transition: 'all 0.5s ease 0.3s',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" strokeLinecap="round" />
                      <path d="M12 16h.01" strokeLinecap="round" />
                    </svg>
                    {error}
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
                    <p className={`text-xs mt-1.5 ${isDark ? 'text-emerald-200/40' : 'text-zinc-400'}`}>Mínimo 6 caracteres</p>
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

                {/* Divider */}
                <div
                  className="flex items-center gap-3 my-6"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.6s ease 0.6s',
                  }}
                >
                  <div className={`flex-1 h-px ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-200'}`} />
                  <span className={`text-xs uppercase tracking-wider ${isDark ? 'text-emerald-400/50' : 'text-emerald-600/50'}`}>o</span>
                  <div className={`flex-1 h-px ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-200'}`} />
                </div>

                {/* Demo button */}
                <div
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.6s ease 0.65s',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleDemo}
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border-2 px-6 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      isDark
                        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10'
                        : 'border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100/70'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 8h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3" />
                      </svg>
                      Probar demo
                    </span>
                  </button>
                </div>

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
            {['Sin tarjeta de crédito', 'Configuración en 5 min', '100% online'].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <PulseDot />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
