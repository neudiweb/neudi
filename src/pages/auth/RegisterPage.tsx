import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/States';
import {
  AuroraBackground,
  NoiseOverlay,
  ParticleField,
  FloatingBadge,
  GlowingCard,
} from '../../components/common/LandingVisuals';
import { VisualInput, VisualButton } from '../../components/common/VisualForm';

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

/* ─── Animated Hero Title ─── */
function AnimatedHeroTitle() {
  const isDark = useTheme().activeTheme === 'dark';
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative" style={{ minHeight: '130px' }}>
      <svg
        viewBox="0 0 1200 200"
        className="w-full h-auto overflow-visible"
        style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
      >
        <defs>
          <linearGradient id="regTitleGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#ffffff' : '#18181b'} />
            <stop offset="100%" stopColor={isDark ? '#e4e4e7' : '#3f3f46'} />
          </linearGradient>
          <linearGradient id="regTitleGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <animate attributeName="x1" values="-100%;100%" dur="4s" repeatCount="indefinite" />
            <animate attributeName="x2" values="0%;200%" dur="4s" repeatCount="indefinite" />
            <stop offset="0%" stopColor={isDark ? '#a1a1aa' : '#52525b'} />
            <stop offset="50%" stopColor={isDark ? '#d4d4d8' : '#3f3f46'} />
            <stop offset="100%" stopColor={isDark ? '#a1a1aa' : '#71717a'} />
          </linearGradient>
          <filter id="regTextGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {loaded && (
          <>
            <text
              x="600" y="80" textAnchor="middle"
              fill="url(#regTitleGrad1)" fontSize="72" fontWeight="900" letterSpacing="-1"
              style={{ opacity: 1, transform: 'translateY(0)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              Creá tu cuenta
            </text>
            <line
              x1="420" y1="95" x2="780" y2="95"
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
              strokeWidth="1"
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}
            />
            <text
              x="600" y="165" textAnchor="middle"
              fill="url(#regTitleGrad2)" fontSize="72" fontWeight="900" letterSpacing="-1"
              filter="url(#regTextGlow)"
              style={{ opacity: 1, transform: 'translateY(0)', transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s' }}
            >
              gratis en segundos
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ─── Subtitle ─── */
function RegSubtitle() {
  const isDark = useTheme().activeTheme === 'dark';
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <p
      className={`mt-8 text-lg sm:text-xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed max-w-xl mx-auto font-light transition-colors duration-700`}
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.5s',
      }}
    >
      Sin tarjeta de crédito, sin compromisos.
      <br />
      Empezá a gestionar tus turnos online ahora.
    </p>
  );
}

/* ─── Main Register Page ─── */
export function RegisterPage() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const isDark = useTheme().activeTheme === 'dark';

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
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-700 ${isDark ? 'bg-zinc-950' : 'bg-gradient-to-br from-emerald-100 via-white to-teal-100'}`}>
      <NoiseOverlay />
      <ThemeToggle />

      <section className="relative overflow-hidden">
        <AuroraBackground />
        <div className={`absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none`}
          style={{
            backgroundImage: `linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            animation: 'gridMove 20s linear infinite',
          }}
        />
        <ParticleField />

        <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              {/* Badge */}
              <FloatingBadge>
                <div className={`inline-flex items-center gap-2 text-xs font-semibold ${isDark ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-800'} border rounded-full px-5 py-2 mb-8 transition-all duration-500`}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Registro gratuito
                </div>
              </FloatingBadge>

              {/* Hero title */}
              <AnimatedHeroTitle />

              {/* Subtitle */}
              <RegSubtitle />

              {/* Form Card */}
              <div className="mt-12">
                <GlowingCard>
                  <div className={`relative rounded-3xl border p-6 sm:p-10 overflow-hidden transition-all duration-700 ${isDark ? 'border-zinc-500/20 bg-zinc-950/20' : 'border-zinc-300/50 bg-white/80'} backdrop-blur-sm`}>
                      {/* Decorative orbs */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className={`absolute top-0 right-0 w-64 h-64 ${isDark ? 'bg-zinc-500/10' : 'bg-zinc-200/40'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
                        <div className={`absolute bottom-0 left-0 w-64 h-64 ${isDark ? 'bg-zinc-500/10' : 'bg-zinc-200/40'} rounded-full blur-3xl translate-y-1/2 -translate-x-1/2`} />
                      </div>

                      <div className="relative">
                        {/* Logo */}
                        <div className="text-center mb-8">
                          <Link to="/" className="inline-flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <span className="text-lg font-black text-white">N</span>
                            </div>
                            <span className={`font-bold text-2xl tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}
                              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>Neudi</span>
                          </Link>
                        </div>

                        {/* Error */}
                        {error && (
                          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-6 border ${isDark ? 'text-red-300 bg-red-500/10 border-red-500/20' : 'text-red-700 bg-red-50 border-red-200'}`}>
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
                          <VisualInput
                            id="name"
                            type="text"
                            label="Tu nombre"
                            placeholder="Juan Pérez"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            icon={
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            }
                          />

                          <VisualInput
                            id="businessName"
                            type="text"
                            label="Nombre del negocio"
                            placeholder="Peluquería Juan"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            icon={
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                              </svg>
                            }
                          />

                          <VisualInput
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            icon={
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                            }
                          />

                          <VisualInput
                            id="password"
                            type="password"
                            label="Contraseña"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            icon={
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                            }
                          />

                          <VisualInput
                            id="confirmPassword"
                            type="password"
                            label="Confirmar contraseña"
                            placeholder="Repetí tu contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            icon={
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                            }
                          />

                          <VisualButton type="submit" className="mt-6" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner size="sm" /> : (
                              <>
                                Crear cuenta
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10 transition-transform duration-500 group-hover:translate-x-1">
                                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </>
                            )}
                          </VisualButton>
                        </form>

                        {/* Login link */}
                        <p className={`text-center text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-6`}>
                          ¿Ya tenés cuenta?{' '}
                          <Link to="/login" className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            Iniciar sesión
                          </Link>
                        </p>
                      </div>
                    </div>
                  </GlowingCard>
              </div>

              {/* Trust indicators */}
              <div className={`mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {[
                  { text: 'Sin tarjeta de crédito', icon: '💳' },
                  { text: 'Configuración en 5 min', icon: '⚡' },
                  { text: '100% gratis', icon: '🎉' },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    {item.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className={`absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t ${isDark ? 'from-zinc-950' : 'from-emerald-100/80'} to-transparent pointer-events-none`} />
      </section>
    </div>
  );
}
