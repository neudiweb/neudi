import * as React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { AuroraBackground, GridOverlay, NoiseOverlay, ParticleField } from '@/components/auth/AuthVisuals';

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Clase de ancho del contenedor de contenido (por defecto max-w-md) */
  maxWidth?: string;
  /** Renderiza la página con overflow-y-auto (forms largos) en vez de overflow-hidden */
  scroll?: boolean;
  showThemeToggle?: boolean;
  showGrid?: boolean;
  showParticles?: boolean;
  /** Contenido extra que se renderiza DESPUES del wrapper centrado (p. ej. modales) */
  after?: React.ReactNode;
}

/**
 * Shell común de las páginas de auth:
 * fondo + NoiseOverlay + AuroraBackground + ParticleField + GridOverlay + ThemeToggle.
 * Reproduce exactamente el chrome de las páginas originales; solo centraliza
 * lo repetido. No reemplaza el contenido interno de cada página.
 */
export function AuthLayout({
  children,
  maxWidth = 'max-w-md',
  scroll = false,
  showThemeToggle = true,
  showGrid = true,
  showParticles = true,
  after,
}: AuthLayoutProps) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  return (
    <div className={`relative min-h-screen ${scroll ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'} transition-colors duration-700 ${isDark ? 'bg-zinc-950' : 'bg-gradient-to-br from-emerald-100 via-white to-teal-100'}`}>
      <NoiseOverlay />
      {showThemeToggle && <ThemeToggle />}
      <AuroraBackground />
      {showParticles && <ParticleField />}
      {showGrid && <GridOverlay />}

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className={`w-full ${maxWidth}`}>{children}</div>
      </div>

      {after}
    </div>
  );
}
