import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  mode: ThemeMode;
  activeTheme: 'light' | 'dark';
  accent: string;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_MODE_KEY = 'neudi-theme-mode';
const STORAGE_ACCENT_KEY = 'neudi-theme-accent';

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 220, s: 84, l: 57 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateAccentCss(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  const lDark = Math.max(l - 18, 12);

  const light = [
    hslToHex(h, Math.max(s - 50, 10), Math.min(l + 40, 97)),
    hslToHex(h, Math.max(s - 40, 15), Math.min(l + 30, 93)),
    hslToHex(h, Math.max(s - 25, 20), Math.min(l + 20, 87)),
    hslToHex(h, Math.max(s - 10, 30), Math.min(l + 8, 78)),
    hslToHex(h, Math.max(s - 5, 40), Math.min(l - 3, 70)),
    hex,
    hslToHex(h, Math.max(s - 5, 40), Math.max(l - 12, 25)),
    hslToHex(h, Math.max(s - 12, 35), Math.max(l - 22, 18)),
  ];

  const dark = [
    hslToHex(h, Math.max(s - 25, 15), Math.min(lDark + 32, 90)),
    hslToHex(h, Math.max(s - 18, 20), Math.min(lDark + 22, 82)),
    hslToHex(h, Math.max(s - 12, 25), Math.min(lDark + 14, 72)),
    hslToHex(h, Math.max(s - 5, 35), Math.min(lDark + 6, 62)),
    hslToHex(h, Math.max(s - 2, 45), Math.min(lDark - 2, 54)),
    hex,
    hslToHex(h, Math.max(s - 2, 45), Math.max(lDark - 8, 34)),
    hslToHex(h, Math.max(s - 5, 40), Math.max(lDark - 14, 26)),
  ];

  return `
    [data-accent="custom-light"] {
      --color-accent-50: ${light[0]};
      --color-accent-100: ${light[1]};
      --color-accent-200: ${light[2]};
      --color-accent-300: ${light[3]};
      --color-accent-400: ${light[4]};
      --color-accent-500: ${light[5]};
      --color-accent-600: ${light[6]};
      --color-accent-700: ${light[7]};
    }
    [data-accent="custom-dark"] {
      --color-accent-50: ${dark[0]};
      --color-accent-100: ${dark[1]};
      --color-accent-200: ${dark[2]};
      --color-accent-300: ${dark[3]};
      --color-accent-400: ${dark[4]};
      --color-accent-500: ${dark[5]};
      --color-accent-600: ${dark[6]};
      --color-accent-700: ${dark[7]};
    }
  `;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_MODE_KEY);
    return (stored as ThemeMode) || 'auto';
  });

  const [accent, setAccentState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_ACCENT_KEY) || 'blue';
  });

  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const resolved = mode === 'auto' ? getSystemPreference() : mode;
    setActiveTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);

    const isCustom = accent.startsWith('#');
    document.documentElement.setAttribute('data-accent', isCustom ? (resolved === 'dark' ? 'custom-dark' : 'custom-light') : accent);

    let styleEl = document.getElementById('dynamic-accent-style');
    if (isCustom && accent.match(/^#[0-9A-Fa-f]{6}$/)) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-accent-style';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = generateAccentCss(accent);
    } else if (styleEl) {
      styleEl.remove();
    }
  }, [mode, accent]);

  function setMode(newMode: ThemeMode) {
    setModeState(newMode);
    localStorage.setItem(STORAGE_MODE_KEY, newMode);
  }

  function setAccent(newAccent: string) {
    setAccentState(newAccent);
    localStorage.setItem(STORAGE_ACCENT_KEY, newAccent);
  }

  return (
    <ThemeContext.Provider value={{ mode, activeTheme, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
