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
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [showTerms, setShowTerms] = React.useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const isDark = useTheme().activeTheme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
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
    if (!acceptedTerms) {
      setError('Debés aceptar los Términos y Condiciones y la Política de Privacidad para continuar.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const result = await register(name, email, password);
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

                          {/* Terms & Conditions checkbox */}
                          <div className={`rounded-xl border p-4 ${isDark ? 'border-zinc-500/20 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50/80'}`}>
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500/30 cursor-pointer shrink-0"
                              />
                              <span className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                He leído y acepto integralmente los{' '}
                                <button type="button" onClick={() => setShowTerms(true)} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Términos y Condiciones</button>
                                {' '}y la{' '}
                                <button type="button" onClick={() => setShowTerms(true)} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Política de Privacidad</button>
                                {' '}de Neudi.
                              </span>
                            </label>
                          </div>

                          <VisualButton type="submit" className="mt-6" disabled={isSubmitting || !acceptedTerms}>
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

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" data-testid="terms-modal">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTerms(false)}
          />
          <div
            className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl border shadow-2xl flex flex-col ${isDark ? 'border-zinc-500/20 bg-zinc-950/95' : 'border-zinc-200 bg-white/95'} backdrop-blur-xl`}
          >
            <style>{`
              @keyframes modalIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>
            <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-zinc-500/20 bg-zinc-950/95' : 'border-zinc-200 bg-white/95'}`}>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Términos y Condiciones · Política de Privacidad</h3>
              <button
                onClick={() => setShowTerms(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-6" style={{ maxHeight: 'calc(80vh - 64px)' }}>
              {/* Términos y Condiciones */}
              <div>
                <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Términos y Condiciones de Servicio</h4>
                <div className={`text-xs leading-relaxed space-y-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>1. Aceptación de los términos.</strong> Al registrarte y utilizar Neudi ("la Plataforma"), confirmás que tenés al menos 18 años de edad y aceptás de forma voluntaria, expresa e inequívoca todos los términos, condiciones y políticas aquí establecidas. Si no estás de acuerdo con cualquiera de estos términos, debés abstenerte de utilizar la Plataforma.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>2. Datos personales y responsabilidades del usuario.</strong> Vos garantizás que toda la información proporcionada durante el registro es veraz, correcta, completa y actualizada. Usted es el único responsable de la confidencialidad y resguardo de sus credenciales de acceso. Neudi se reserva el derecho de suspender o cancelar cualquier cuenta en la que se detecte información falsa, incompleta o que viole estos términos.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>3. Consentimiento para el tratamiento de datos.</strong> Al utilizar Neudi, usted consiente expresamente que Neudi y sus proveedores de servicios terceros (incluyendo, pero no limitándose a, proveedores de infraestructura en la nube, bases de datos, servicios de autenticación y plataformas de alojamiento) podrán recopilar, almacenar y procesar los datos proporcionados por usted y por sus clientes o usuarios finales, incluyendo pero no limitándose a: nombre, apellido, email, teléfono, dirección, horarios de atención, datos de reservas, historial de clientes y cualquier otra información que usted decida ingresar en la Plataforma. Este tratamiento de datos se realiza exclusivamente con el propósito de brindar el servicio de gestión de turnos y reservas que Neudi ofrece.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>4. Servicios de terceros y limitación de responsabilidad en materia de seguridad.</strong> Neudi utiliza infraestructura y servicios de terceros independientes (incluyendo, entre otros, Supabase, Google Firebase, AWS, y cualquier otra plataforma de base de datos, autenticación o alojamiento) para operar la Plataforma. Usted reconoce y acepta expresamente que: (a) Neudi no controla directamente los servidores, bases de datos o sistemas de seguridad de dichos terceros; (b) aunque los proveedores de servicios terziarios implementan medidas de seguridad razonables y estándares de la industria, ninguna transmisión de datos por Internet o sistema de almacenamiento electrónico es 100% seguro o infalible; (c) Neudi no garantiza ni ofrece ninguna representación de que los sistemas de terceros sean inmunes a accesos no autorizados, hackeos, brechas de seguridad, ataques cibernéticos, fallos técnicos, desastres naturales, o cualquier otro evento que pueda comprometer la confidencialidad, integridad o disponibilidad de los datos; (d) en caso de que ocurra una brecha de seguridad, incidente de ciberseguridad o acceso no autorizado a los sistemas de terceros, Neudi no será responsable directa ni indirectamente por daños, pérdidas, perjuicios, filtraciones de datos, daños punitivos, lucro cesante, daño emergente, daño moral, o cualquier otro tipo de daño que resulte directa o indirectamente de dicho incidente; (e) usted asume total y expresamente el riesgo asociado al almacenamiento y procesamiento de datos en infraestructura de terceros.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>5. Limitación de responsabilidad general.</strong> Neudi se provee la Plataforma "tal cual" y "según disponibilidad", sin ningún tipo de garantía, expresa o implícita. Neudi, sus desarrolladores, socios, empleados, proveedores de servicios y afiliados no serán bajo ninguna circunstancia responsables por: (a) daños directos, indirectos, incidentales, especiales, consecuentes, punitivos, emergentes, lucro cesante, pérdida de datos, pérdida de clientes, perjuicios comerciales o cualquier otro daño de cualquier naturaleza; (b) interrupciones, errores, omisiones, retrasos en el funcionamiento de la Plataforma; (c) pérdida o corrupción de datos almacenados en la Plataforma; (d) inaccesibilidad temporal o permanente a la Plataforma; (e) decisiones comerciales tomadas por usted basadas en información proporcionada por la Plataforma; (f) cualquier modificación, suspensión o terminación del servicio, temporal o permanente. Esta limitación de responsabilidad aplica sin importar la causa, teoría legal (contractual, extracontractual, negligencia, responsabilidad estricta, etc.), aunque se haya advertido de la posibilidad de dichos daños.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>6. Uso de datos de clientes y usuarios finales.</strong> Usted es el responsable exclusivo de: (a) obtener el consentimiento de sus clientes y usuarios finales para recopilar, almacenar y procesar sus datos personales a través de la Plataforma; (b) cumplir con todas las leyes, regulaciones y obligaciones de protección de datos aplicables en su jurisdicción en relación con el tratamiento de datos de terceros; (c) informar adecuadamente a sus clientes sobre el uso de sus datos; (d) responder ante cualquier reclamación, denuncia, acción legal o sanción que surja del tratamiento de datos de clientes o usuarios finales. Neudi actúa únicamente como proveedor de tecnología de la Plataforma y no como responsable del tratamiento de datos de sus clientes. Usted acepta indemnizar, defender y eximir de responsabilidad a Neudi ante cualquier reclamación derivada del tratamiento de datos de sus clientes.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>7. Propiedad intelectual.</strong> Todos los derechos de propiedad intelectual e industrial sobre la Plataforma, su código fuente, interfaz, diseño, logotipos, marcas, contenido y funcionalidades, pertenecen exclusivamente a Neudi y sus licenciantes. Se prohíbe la reproducción, distribución, modificación, creación de obras derivadas, ingeniería inversa o descompilación de la Plataforma sin autorización previa y por escrito de Neudi.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>8. Suspensión y terminación.</strong> Neudi se reserva el derecho, a su entera discreción, de suspender, restringir o terminar su acceso a la Plataforma en cualquier momento y por cualquier motivo, con o sin previo aviso, incluyendo pero no limitándose a: violación de estos términos, actividades ilegales, conducta abusiva, solicitud del usuario, o cambio, modificación o discontinuación de la Plataforma.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>9. Modificaciones.</strong> Neudi se reserva el derecho de modificar estos Términos y Condiciones, la Política de Privacidad y cualquier otra política en cualquier momento. Las modificaciones serán efectivas desde su publicación en la Plataforma. El uso continuado de la Plataforma después de las modificaciones constituye aceptación de los términos actualizados.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>10. Ley aplicable y jurisdicción.</strong> Estos términos se rigen por las leyes aplicables en la jurisdicción donde Neudi opera. Para cualquier controversia derivada de estos términos, las partes se someten a la jurisdicción de los tribunales competentes, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.</p>
                </div>
              </div>
              {/* Política de Privacidad */}
              <div>
                <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Política de Privacidad y Tratamiento de Datos</h4>
                <div className={`text-xs leading-relaxed space-y-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>1. Responsable del tratamiento.</strong> Los datos personales recogidos a través de Neudi son tratados por Neudi como responsable del tratamiento de la Plataforma. Los datos se procesan utilizando infraestructura de terceros proveedores de servicios en la nube.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>2. Datos que recopilamos.</strong> Recopilamos los datos que usted proporciona voluntariamente al registrarse (nombre, email, contraseña) y los datos que usted ingrese al configurar su negocio y gestionar turnos (datos de clientes, horarios, servicios, reservas, etc.).</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>3. Finalidad del tratamiento.</strong> Los datos se procesan exclusivamente para: brindar el servicio de gestión de turnos y reservas, mantener su cuenta activa, comunicarnos con usted en relación al servicio, y mejorar la funcionalidad de la Plataforma.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>4. Base legal.</strong> La base legal para el tratamiento de datos es su consentimiento expreso (al registrarse), la ejecución del contrato de servicios, y nuestro interés legítimo en mejorar la Plataforma.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>5. Transferencias internacionales y terceros.</strong> Sus datos pueden ser almacenados y procesados en servidores de terceros proveedores ubicados en diferentes jurisdicciones. Usted consiente expresamente estas transferencias internacionales de datos y reconoce que las leyes de protección de datos pueden variar según la jurisdicción del servidor.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>6. Seguridad.</strong> Implementamos medidas de seguridad técnicas y organizativas razonables para proteger sus datos. Sin embargo, usted reconoce que ninguna medida de seguridad es infalible y que los servicios de terceros operan bajo sus propios estándares de seguridad.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>7. Derechos del usuario.</strong> Usted tiene derecho a acceder, rectificar, suprimir, limitar el tratamiento de sus datos, portabilidad de datos, y oponerse al tratamiento. Para ejercer estos derechos, contacte a Neudi a través de los canales disponibles en la Plataforma.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>8. Conservación de datos.</strong> Los datos se conservarán mientras su cuenta esté activa y durante los plazos establecidos por la ley aplicable. Usted puede solicitar la eliminación de sus datos en cualquier momento.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>9. Cookies y tecnologías similares.</strong> La Plataforma puede utilizar cookies y tecnologías similares para mejorar la experiencia de usuario, analizar el uso de la Plataforma y personalizar el contenido.</p>
                  <p><strong className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>10. Menores de edad.</strong> La Plataforma no está dirigida a menores de 18 años. No recopilamos datos de menores de edad.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
