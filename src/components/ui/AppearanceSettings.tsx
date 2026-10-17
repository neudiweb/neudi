import { useTheme } from '../../contexts/ThemeContext';

const ACCENT_PRESETS = [
  { name: 'Azul', value: 'blue', hex: '#3b82f6' },
  { name: 'Verde', value: 'green', hex: '#22c55e' },
  { name: 'Violeta', value: 'violet', hex: '#8b5cf6' },
  { name: 'Rosa', value: 'pink', hex: '#ec4899' },
  { name: 'Naranja', value: 'orange', hex: '#f97316' },
  { name: 'Neutro', value: 'neutral', hex: '#6b7280' },
];

export default function AppearanceSettings() {
  const { mode, accent, setMode, setAccent } = useTheme();

  return (
    <div className="space-y-8">
      {/* Theme Mode */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Modo de tema</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Seleccioná cómo querés que se vea Neudi.</p>
        <div className="flex gap-3">
          {(['light', 'dark', 'auto'] as const).map((option) => (
            <label
              key={option}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-all
                ${mode === option
                  ? 'border-accent-500 bg-accent-50 text-accent-700'
                  : 'border-[var(--color-border-primary)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)]'
                }
              `}
            >
              <input
                type="radio"
                name="theme-mode"
                value={option}
                checked={mode === option}
                onChange={() => setMode(option)}
                className="sr-only"
              />
              {option === 'light' ? 'Claro' : option === 'dark' ? 'Oscuro' : 'Automático'}
            </label>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Color de acento</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Personalizá el color principal de la interfaz.</p>

        {/* Presets */}
        <div className="flex flex-wrap gap-3 mb-4">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setAccent(preset.value)}
              className={`
                w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center
                ${accent === preset.value
                  ? 'border-[var(--color-text-primary)] scale-110'
                  : 'border-transparent hover:scale-105'
                }
              `}
              style={{ backgroundColor: preset.hex }}
              title={preset.name}
              aria-label={`Color ${preset.name}`}
            >
              {accent === preset.value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Custom HEX */}
        <div className="flex items-center gap-3">
          <label htmlFor="custom-accent" className="text-xs text-[var(--color-text-secondary)] font-medium">Personalizado:</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accent.startsWith('#') ? accent : '#3b82f6'}
              onChange={(e) => {
                const hex = e.target.value;
                setAccent(hex);
              }}
              className="w-8 h-8 rounded border border-[var(--color-border-primary)] cursor-pointer"
              title="Selector de color"
            />
            <input
              id="custom-accent"
              type="text"
              value={accent.startsWith('#') ? accent : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setAccent(val);
                }
              }}
              placeholder="#3b82f6"
              className="w-28 px-2 py-1.5 text-xs border border-[var(--color-border-primary)] rounded-md font-mono bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
