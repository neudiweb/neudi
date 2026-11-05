import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

function GlowOrb({ className }: { className?: string }) {
  return <div className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent blur-3xl animate-aurora-1" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-transparent blur-3xl animate-aurora-2" />
      <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-red-500/5 via-orange-500/3 to-transparent blur-3xl animate-aurora-3" />
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

export function BusinessNotFoundPage() {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const [countdown, setCountdown] = React.useState(5);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (countdown <= 0) {
      navigate('/', { replace: true });
      return;
    }
    const interval = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, navigate]);

  const handleRedirect = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-700 ${isDark ? 'bg-zinc-950' : 'bg-gradient-to-br from-red-50 via-white to-orange-50'}`}>
      <NoiseOverlay />
      <AuroraBackground />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div
            className="transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            }}
          >
            <div className="flex justify-center mb-8">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${isDark ? 'bg-red-500/10' : 'bg-red-100'}`}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={isDark ? 'text-red-400' : 'text-red-500'}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" strokeLinecap="round" />
                  <path d="M12 16h.01" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'} mb-3`}
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
              Página no encontrada
            </h1>

            <p className={`text-lg leading-relaxed mb-2 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
              Ese enlace no existe o fue modificado.
            </p>

            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'} mb-8`}>
              Serás redirigido automáticamente en {countdown} segundos.
            </p>

            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < countdown
                        ? isDark ? 'bg-emerald-400' : 'bg-emerald-500'
                        : isDark ? 'bg-zinc-700' : 'bg-zinc-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleRedirect}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-8 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isDark
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10'
                  : 'border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100/70'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
