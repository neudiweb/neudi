import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

/* ===========================
   HELPERS & ANIMATED COMPONENTS
   =========================== */

function GlowOrb({ className }: { className?: string }) {
  return <div className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

function ThemeToggle() {
  const { activeTheme, setMode } = useTheme();
  const isDark = activeTheme === 'dark';

  return (
    <button
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className="fixed top-4 right-4 z-50 flex items-center justify-center rounded-full border border-emerald-300/50 dark:border-emerald-700/50 bg-white/90 dark:bg-zinc-900/90 w-10 h-10 shadow-lg shadow-emerald-500/5 dark:shadow-emerald-500/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-pointer"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-800">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

/* ─── Aurora Background ─── */
function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 left-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl animate-aurora-1" />
      <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-500/15 via-green-500/10 to-transparent blur-3xl animate-aurora-2" />
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-emerald-500/10 via-lime-500/5 to-transparent blur-3xl animate-aurora-3" />
    </div>
  );
}

/* ─── Noise Overlay ─── */
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

/* ─── Marquee (infinite scroll logos) ─── */
function MarqueeLogos() {
  const isDark = useTheme().activeTheme === 'dark';
  const logos = [
    { name: 'Salud & Bienestar', icon: '💆' },
    { name: 'Peluquerías', icon: '✂️' },
    { name: 'Gimnasios', icon: '🏋️' },
    { name: 'Consultorios', icon: '🩺' },
    { name: 'Talleres', icon: '🔧' },
    { name: 'Clases', icon: '📚' },
    { name: 'Estudios', icon: '📷' },
    { name: 'Restaurantes', icon: '🍽️' },
  ];

  return (
    <div className="relative overflow-hidden py-8">
      <div className={`pointer-events-none absolute left-0 top-0 h-full w-32 z-10 bg-gradient-to-r ${isDark ? 'from-zinc-950' : 'from-white'} to-transparent`} />
      <div className={`pointer-events-none absolute right-0 top-0 h-full w-32 z-10 bg-gradient-to-l ${isDark ? 'from-zinc-950' : 'from-white'} to-transparent`} />
      <div className="flex animate-marquee">
        {[...logos, ...logos].map((logo, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 mx-8 px-6 py-3 rounded-xl border transition-all duration-300 hover:scale-105 ${
              isDark
                ? 'border-emerald-500/10 bg-emerald-950/20 text-emerald-300/70 hover:border-emerald-500/30 hover:bg-emerald-950/40'
                : 'border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100'
            }`}
          >
            <span className="text-2xl">{logo.icon}</span>
            <span className="text-sm font-semibold whitespace-nowrap">{logo.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  React.useEffect(() => {
    if (!started) return;
    let frame: number;
    let start: number | null = null;
    const duration = 2000;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [started, value]);

  return (
    <div ref={ref}>
      <span className="tabular-nums">{count}{suffix}</span>
    </div>
  );
}

/* ─── SVG Animated Hero Title ─── */
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
          {/* Gradient for main text */}
          <linearGradient id="titleGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#ffffff' : '#18181b'} />
            <stop offset="100%" stopColor={isDark ? '#e4e4e7' : '#3f3f46'} />
          </linearGradient>
          {/* Gradient for emphasized text */}
          <linearGradient id="titleGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <animate attributeName="x1" values="-100%;100%" dur="4s" repeatCount="indefinite" />
            <animate attributeName="x2" values="0%;200%" dur="4s" repeatCount="indefinite" />
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="33%" stopColor="#14b8a6" />
            <stop offset="66%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
          {/* Glow filter for emphasized text */}
          <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Clip path for reveal */}
          <clipPath id="line1Clip">
            <rect x="0" y="0" width="1200" height="200" />
          </clipPath>
        </defs>

        {/* Line 1: "Turnos online que" */}
        <g clipPath="url(#line1Clip)">
          {loaded && (
            <>
              <text
                x="600"
                y="80"
                textAnchor="middle"
                fill="url(#titleGrad1)"
                fontSize="72"
                fontWeight="900"
                letterSpacing="-1"
                className="transition-all duration-700"
                style={{
                  opacity: 1,
                  transform: 'translateY(0)',
                  transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                Turnos online que
              </text>
              {/* Subtle underline */}
              <line
                x1="380"
                y1="95"
                x2="820"
                y2="95"
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                strokeWidth="1"
                style={{
                  opacity: loaded ? 1 : 0,
                  transition: 'opacity 0.8s ease 0.3s',
                }}
              />
            </>
          )}
        </g>

        {/* Line 2: "simplifican la gestión de tu negocio" */}
        <g>
          {loaded && (
            <text
              x="600"
              y="165"
              textAnchor="middle"
              fill="url(#titleGrad2)"
              fontSize="72"
              fontWeight="900"
              letterSpacing="-1"
              filter="url(#textGlow)"
              style={{
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
              }}
            >
              simplifican la gestión de tu negocio
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}

/* ─── Subtitle with gradient pulse ─── */
function HeroSubtitle() {
  const isDark = useTheme().activeTheme === 'dark';
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <p
      className={`mt-8 text-lg sm:text-xl lg:text-2xl ${isDark ? 'text-emerald-100/60' : 'text-zinc-800'} leading-relaxed max-w-3xl mx-auto font-light transition-colors duration-700`}
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.5s',
      }}
    >
      Neudi permite que tus clientes reserven turnos{' '}
      <strong className={`font-semibold ${isDark ? 'text-emerald-200' : 'text-zinc-900'}`}>24/7</strong>{' '}
      sin llamadas ni mensajes.
      <br />
      Vos gestionás todo desde un panel simple.
    </p>
  );
}

/* ─── Scroll Reveal Card ─── */
function ScrollRevealCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Steps Section ─── */
function HowItWorks() {
  const isDark = useTheme().activeTheme === 'dark';
  const steps = [
    {
      step: '01',
      title: 'Creá tu cuenta',
      desc: 'Configurá tu negocio en menos de 30 segundos.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      step: '02',
      title: 'Configurá tus servicios',
      desc: 'Agregá servicios, precios, duración y horarios en minutos.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <path d="M12 3v18" />
          <path d="M3 12h18" />
          <rect x="7" y="7" width="10" height="10" rx="2" />
        </svg>
      ),
      color: 'from-teal-500 to-teal-600',
    },
    {
      step: '03',
      title: 'Compartí tu link',
      desc: 'Tus clientes reservan desde cualquier dispositivo, 24/7.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
    },
    {
      step: '04',
      title: '¡Gestioná todo!',
      desc: 'Recibí turnos, organizá tu agenda y hacé crecer tu negocio.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      color: 'from-lime-500 to-lime-600',
    },
  ];

  return (
    <section className="relative py-28 sm:py-36">
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-100/40'} rounded-full blur-3xl`} />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className={`inline-block text-xs font-bold uppercase tracking-[0.25em] mb-5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            Cómo funciona
          </span>
          <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}
            style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
            Empezá en{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
              4 simples pasos
            </span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <ScrollRevealCard key={i} delay={i * 150}>
              <div className="group relative rounded-2xl border border-emerald-500/10 dark:border-emerald-500/20 bg-white/60 dark:bg-emerald-950/20 p-8 backdrop-blur-md transition-all duration-500 hover:border-emerald-500/40 dark:hover:border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20 hover:-translate-y-2 cursor-default h-full">
                <div className={`absolute -top-4 -right-4 w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xs font-black shadow-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110`}>
                  {step.step}
                </div>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br ${step.color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  {step.icon}
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-emerald-50' : 'text-zinc-900'} mb-2`}>{step.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'}`}>{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className={`hidden lg:block absolute top-1/2 -right-3 w-6 h-px ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-300/50'}`} />
                )}
              </div>
            </ScrollRevealCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Shimmer Button ─── */
function ShimmerButton({ children, href, className = '' }: { children: React.ReactNode; href: string; className?: string }) {
  return (
    <Link
      to={href}
      className={`group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-12 py-4.5 text-lg font-bold text-white shadow-2xl shadow-emerald-500/25 transition-all duration-500 hover:shadow-emerald-500/40 hover:scale-105 active:scale-100 overflow-hidden ${className}`}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Link>
  );
}

/* ─── Feature Card Enhanced ─── */
function FeatureCard({ icon, title, desc, accent, delay }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  delay: number;
}) {
  const [hovered, setHovered] = React.useState(false);
  const isDark = useTheme().activeTheme === 'dark';

  return (
    <ScrollRevealCard delay={delay}>
      <div
        className="group relative rounded-2xl border border-emerald-500/10 dark:border-emerald-500/20 bg-white/60 dark:bg-emerald-950/20 p-6 backdrop-blur-md transition-all duration-500 hover:border-emerald-500/40 dark:hover:border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20 hover:-translate-y-2 cursor-default"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-green-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none`} />
        <div className="absolute inset-px rounded-xl bg-white/80 dark:bg-emerald-950/30 pointer-events-none" />
        <div className="relative">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 ${accent} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${hovered ? 'shadow-xl' : ''}`}>
            {icon}
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-emerald-50' : 'text-zinc-900'} mb-2 transition-colors duration-300`}>{title}</h3>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'}`}>{desc}</p>
        </div>
      </div>
    </ScrollRevealCard>
  );
}

/* ─── Floating 3D Badge ─── */
function FloatingBadge({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className="relative perspective-1000"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{
          transform: hovered ? 'rotateX(5deg) rotateY(-5deg) scale(1.05)' : 'rotateX(0) rotateY(0) scale(1)',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Particle Field ─── */
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-emerald-400/15 dark:bg-emerald-300/10 animate-float-slow"
          style={{
            left: `${(i * 5.3) % 100}%`,
            top: `${(i * 7.7) % 100}%`,
            width: `${3 + (i % 6)}px`,
            height: `${3 + (i % 6)}px`,
            animationDelay: `${(i % 8)}s`,
            animationDuration: `${10 + (i % 10)}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── 3D Tilt Card ─── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [transform, setTransform] = React.useState('perspective(1000px) rotateX(0) rotateY(0)');

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setTransform('perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)');
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 0.1s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
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

/* ─── Scroll Progress Bar ─── */
function ScrollProgressBar() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/* ─── Floating Action Button ─── */
function FloatingCTA() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
    >
      <Link
        to="/login"
        className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-100 transition-all duration-300 overflow-hidden"
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        <span className="relative z-10 flex items-center gap-2">
          EMPEZAR
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </div>
  );
}

/* ===========================
   MAIN PAGE
   =========================== */

export function HomePage() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        </svg>
      ),
      title: 'Calendario inteligente',
      desc: 'Tus clientes ven los horarios disponibles y reservan al instante. Sin conflictos ni solapamientos.',
      accent: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Gestión de clientes',
      desc: 'Historial de visitas, preferencias y datos de contacto de cada cliente en un solo lugar.',
      accent: 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-500/25',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0 2-2h-2" />
          <rect x="9" y="5" width="6" height="3" rx="1" />
        </svg>
      ),
      title: 'Servicios personalizables',
      desc: 'Configurá servicios, duración, precios y opciones como seña o depósito.',
      accent: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" strokeLinecap="round" />
        </svg>
      ),
      title: 'Horarios flexibles',
      desc: 'Definí horarios por día, feriados y períodos especiales fácilmente.',
      accent: 'bg-gradient-to-br from-lime-500 to-lime-600 shadow-lime-500/25',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Página de reserva',
      desc: 'Cada negocio tiene su página personalizada para que los clientes reserven online.',
      accent: 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/25',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      title: 'Fácil de usar',
      desc: 'Interfaz intuitiva tanto para vos como para tus clientes. Sin curva de aprendizaje.',
      accent: 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/25',
    },
  ];

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-700 ${isDark ? 'bg-zinc-950' : 'bg-gradient-to-b from-emerald-200/70 via-emerald-100/50 to-white'}`}>
      <NoiseOverlay />
      <ThemeToggle />
      <FloatingCTA />

      {/* ===== HERO ===== */}
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

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            {/* Animated badge */}
            <FloatingBadge>
              <div className={`inline-flex items-center gap-2 text-xs font-semibold ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-800'} border rounded-full px-5 py-2 mb-8 transition-all duration-500`}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Sistema de turnos gratuito para tu negocio
              </div>
            </FloatingBadge>

            {/* Hero title — SVG animated gradient */}
            <AnimatedHeroTitle />

            {/* Subtitle */}
            <HeroSubtitle />

            {/* CTA buttons */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
              <ShimmerButton href="/login">EMPEZAR<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10 transition-transform duration-500 group-hover:translate-x-1.5"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg></ShimmerButton>
              <a
                href="#como-funciona"
                className={`inline-flex items-center gap-2.5 rounded-2xl border px-9 py-4 text-lg font-medium transition-all duration-500 hover:scale-105 active:scale-100 ${isDark ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-900/40 hover:border-emerald-400/40' : 'border-emerald-300 bg-white/80 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400'}`}
              >
                ¿Cómo funciona?
              </a>
            </div>

            {/* Trust indicators */}
            <div className={`mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm ${isDark ? 'text-emerald-200/50' : 'text-zinc-500'} transition-colors duration-700`}>
              {[
                { text: 'Sin complicaciones' },
                { text: 'Configuración en 5 min' },
                { text: '100% online' },
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className={`absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t ${isDark ? 'from-zinc-950' : 'from-emerald-100/80'} to-transparent pointer-events-none`} />
      </section>

      {/* ===== MARQUEE ===== */}
      <section className={`relative py-12 ${isDark ? 'bg-emerald-950/20' : 'bg-emerald-50/50'}`}>
        <div className="text-center mb-8">
          <span className={`text-xs font-bold uppercase tracking-[0.25em] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            Ideal para tu negocio
          </span>
        </div>
        <MarqueeLogos />
      </section>

      {/* ===== FEATURES ===== */}
      <section id="como-funciona" className="relative py-28 sm:py-36">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-100/40'} rounded-full blur-3xl`} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className={`inline-block text-xs font-bold uppercase tracking-[0.25em] mb-5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Funcionalidades
            </span>
            <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
              Todo lo que necesitás para potenciar tu negocio,
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                nada que no
              </span>
            </h2>
            <p className={`mt-5 text-base sm:text-lg ${isDark ? 'text-emerald-200/50' : 'text-zinc-500'} max-w-xl mx-auto leading-relaxed font-light transition-colors duration-700`}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Neudi se encarga de la gestión de turnos para que vos puedas enfocarte en lo que importa: tu negocio.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, i) => (
              <GlowingCard key={i}>
                <FeatureCard {...item} delay={i * 100} />
              </GlowingCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorks />

      {/* ===== STATS ===== */}
      <section className="relative py-20">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-emerald-950/30 via-teal-950/20 to-green-950/30' : 'bg-gradient-to-r from-emerald-100 via-teal-100 to-green-100'}`} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 100, suffix: '%', label: 'Sin costos ocultos' },
              { value: 24, suffix: '/7', label: 'Turnos automáticos' },
              { value: 5, suffix: ' min', label: 'Configuración rápida' },
              { value: 0, label: 'Llamadas perdidas' },
            ].map((stat, i) => (
              <ScrollRevealCard key={i} delay={i * 100}>
                <div className="group">
                  <div className={`text-4xl sm:text-5xl font-black bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent transition-transform duration-500 group-hover:scale-110`}
                    style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className={`mt-2 text-sm font-medium ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'} transition-colors duration-700`}>{stat.label}</div>
                </div>
              </ScrollRevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-28 sm:py-36">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlowingCard>
            <div className={`relative rounded-3xl border p-10 sm:p-16 text-center overflow-hidden transition-all duration-700 ${isDark ? 'border-emerald-500/20 bg-emerald-950/20' : 'border-emerald-300 bg-white/80'} backdrop-blur-sm`}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className={`absolute top-0 right-0 w-96 h-96 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-200/50'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
                  <div className={`absolute bottom-0 left-0 w-96 h-96 ${isDark ? 'bg-teal-500/10' : 'bg-teal-200/50'} rounded-full blur-3xl translate-y-1/2 -translate-x-1/2`} />
                </div>
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/30 mb-10 transition-transform duration-500 hover:rotate-6 hover:scale-110">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'} mb-5 transition-colors duration-700`}
                    style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                    ¿Listo para simplificar
                    <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                      tu negocio?
                    </span>
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'} max-w-md mx-auto mb-12 leading-relaxed font-light transition-colors duration-700`}
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    Creá tu cuenta y empezá a recibir turnos online en minutos.
                  </p>
                  <ShimmerButton href="/register">
                    Crear mi cuenta gratuita
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10 transition-transform duration-500 group-hover:translate-x-1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </ShimmerButton>
                </div>
              </div>
            </GlowingCard>
          </div>
        </section>

      {/* ===== FOOTER ===== */}
      <footer className={`border-t py-12 transition-colors duration-700 ${isDark ? 'border-emerald-500/10' : 'border-emerald-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <span className="text-sm font-black text-white">N</span>
            </div>
            <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-emerald-50' : 'text-zinc-900'} transition-colors duration-700`}
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>Neudi</span>
          </Link>
          <p className={`text-sm ${isDark ? 'text-emerald-200/40' : 'text-zinc-400'} transition-colors duration-700`}>© 2026 Neudi. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
