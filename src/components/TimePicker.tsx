import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tempHour, setTempHour] = useState(() => parseInt(value.split(':')[0]));
  const [tempMinute, setTempMinute] = useState(() => parseInt(value.split(':')[1]));

  // Sync local state only when picker is closed
  useEffect(() => {
    if (!isOpen) {
      setTempHour(parseInt(value.split(':')[0]));
      setTempMinute(parseInt(value.split(':')[1]));
    }
  }, [value, isOpen]);

  // Reset local state when picker opens
  useEffect(() => {
    if (isOpen) {
      setTempHour(parseInt(value.split(':')[0]));
      setTempMinute(parseInt(value.split(':')[1]));
    }
  }, [isOpen, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const formatDisplay = () => {
    return `${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 sm:gap-2.5 h-10 sm:h-11 px-3 sm:px-4 rounded-lg border text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-2 ${
          disabled
            ? 'bg-[var(--color-bg-surface)] border-[var(--color-border-primary)] text-[var(--color-text-secondary)] cursor-not-allowed'
            : isOpen
              ? 'border-accent-500 ring-2 ring-accent-500/30 bg-[var(--color-bg-surface)]'
              : 'border-[var(--color-border-primary)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-strong)] text-[var(--color-text-primary)]'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={disabled ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-secondary)]'}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="min-w-[72px] sm:min-w-[100px]">{formatDisplay()}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-[var(--color-text-secondary)]`}>
          <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl shadow-xl p-4 w-80">
          {/* Live preview */}
          <div className="mb-3 text-center py-3 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl">
            <span className="text-3xl font-bold text-white tracking-wider">{formatDisplay()}</span>
          </div>

          {/* Two-column picker */}
          <div className="flex gap-3 mb-3">
            {/* Hours column */}
            <div className="flex-1">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 text-center uppercase tracking-wider">Hora</div>
              <div className="h-40 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] p-1 custom-scrollbar">
                <div className="grid grid-cols-3 gap-1">
                  {hours.map((h) => {
                    const hNum = parseInt(h);
                    const isSelected = hNum === tempHour;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTempHour(hNum)}
                        className={`h-9 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] shadow-sm ring-2 ring-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)]'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-[var(--color-border-primary)] self-stretch" />

            {/* Minutes column */}
            <div className="flex-1">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 text-center uppercase tracking-wider">Minuto</div>
              <div className="h-40 overflow-y-auto rounded-lg border border-[var(--color-border-primary)] p-1 custom-scrollbar">
                <div className="grid grid-cols-5 gap-1">
                  {minutes.map((m) => {
                    const mNum = parseInt(m);
                    const isSelected = mNum === tempMinute;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTempMinute(mNum)}
                        className={`h-9 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] shadow-sm ring-2 ring-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-secondary)]">Formato 24h</span>
            <button
              type="button"
              onClick={() => {
                onChange(`${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`);
                setIsOpen(false);
              }}
              className="text-xs font-semibold bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] px-4 py-1.5 rounded-md hover:opacity-90 transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
