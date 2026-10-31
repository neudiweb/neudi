import * as React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/* ===========================
   REUSABLE LANDING VISUAL COMPONENTS
   =========================== */

/** Animated glowing orbs background */
export function AuroraBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -top-40 left-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl animate-aurora-1" />
      <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-500/15 via-green-500/10 to-transparent blur-3xl animate-aurora-2" />
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-emerald-500/10 via-lime-500/5 to-transparent blur-3xl animate-aurora-3" />
    </div>
  );
}

/** SVG noise texture overlay */
export function NoiseOverlay() {
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

/** Floating particle dots */
export function ParticleField() {
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

/** Fade-in on scroll card wrapper */
export function ScrollRevealCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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

/** 3D tilt card */
export function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
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

/** Mouse-following glow card */
export function GlowingCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
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

/** Floating badge with 3D hover */
export function FloatingBadge({ children }: { children: React.ReactNode }) {
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

/** Animated counter with intersection observer */
export function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
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

/** Shimmer/gradient button with shine effect */
export function ShimmerButton({ children, href, className = '', onClick }: {
  children: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }}
      className={`group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-9 py-4 text-lg font-bold text-white shadow-2xl shadow-emerald-500/25 transition-all duration-500 hover:shadow-emerald-500/40 hover:scale-105 active:scale-100 overflow-hidden ${className}`}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      <span className="relative z-10">{children}</span>
    </a>
  );
}

/** Feature card with glow on hover */
export function FeatureCard({ icon, title, desc, accent, delay }: {
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

/** Step card for "how it works" sections */
export function StepCard({ step, title, desc, icon, color, delay }: {
  step: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}) {
  const isDark = useTheme().activeTheme === 'dark';

  return (
    <ScrollRevealCard delay={delay || 0}>
      <div className="group relative rounded-2xl border border-emerald-500/10 dark:border-emerald-500/20 bg-white/60 dark:bg-emerald-950/20 p-8 backdrop-blur-md transition-all duration-500 hover:border-emerald-500/40 dark:hover:border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20 hover:-translate-y-2 cursor-default h-full">
        <div className={`absolute -top-4 -right-4 w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-black shadow-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110`}>
          {step}
        </div>
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br ${color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
        <h3 className={`text-xl font-bold ${isDark ? 'text-emerald-50' : 'text-zinc-900'} mb-2`}>{title}</h3>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'}`}>{desc}</p>
      </div>
    </ScrollRevealCard>
  );
}
