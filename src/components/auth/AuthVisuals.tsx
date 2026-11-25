import * as React from 'react';

/**
 * Visuales compartidos de las páginas de auth.
 * Antes duplicados (idénticos o casi) en LoginPage, ResetPasswordPage y RegisterPage.
 */

/** Animated glowing orbs background */
export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl animate-aurora-1" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-500/15 via-green-500/10 to-transparent blur-3xl animate-aurora-2" />
      <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-emerald-500/10 via-lime-500/5 to-transparent blur-3xl animate-aurora-3" />
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

/** Grid overlay del estilo auth (60px grid, animation gridMove) */
export function GridOverlay() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        animation: 'gridMove 20s linear infinite',
      }}
    />
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

/** Floating Logo Badge */
export function FloatingLogo() {
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

/** Shimmer/gradient button with shine effect (botones de formulario) */
export function ShimmerButton({ children, onClick, className = '', disabled = false }: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-9 py-3 text-lg font-bold text-white shadow-2xl shadow-emerald-500/25 transition-all duration-500 hover:shadow-emerald-500/40 hover:scale-105 active:scale-100 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

/** Pulse Dot (indicador de confianza) */
export function PulseDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
    </span>
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
