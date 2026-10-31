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
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-0.5 h-7 sm:h-8 px-1.5 sm:px-2 rounded-md border text-[10px] sm:text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 focus-visible:outline-offset-2 w-full ${
          disabled
            ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
            : isOpen
              ? 'border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/20 dark:ring-zinc-100/20 bg-white dark:bg-zinc-900'
              : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-900 dark:text-zinc-100'
        }`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 dark:text-zinc-500 shrink-0 hidden sm:block">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="min-w-[32px] text-center text-[10px] sm:text-xs">{formatDisplay()}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform shrink-0 text-zinc-400 dark:text-zinc-500 ${isOpen ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-3 w-60 sm:w-72">
          {/* Live preview */}
          <div className="mb-3 text-center py-3 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 rounded-xl">
            <span className="text-3xl font-bold text-white dark:text-zinc-900 tracking-wider">{formatDisplay()}</span>
          </div>

          {/* Two-column picker */}
          <div className="flex gap-3 mb-3">
            {/* Hours column */}
            <div className="flex-1">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-wider">Hora</div>
              <div className="h-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 custom-scrollbar">
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
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm ring-2 ring-zinc-900 dark:ring-zinc-100'
                            : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
            <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch" />

            {/* Minutes column */}
            <div className="flex-1">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-wider">Minuto</div>
              <div className="h-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 custom-scrollbar">
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
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm ring-2 ring-zinc-900 dark:ring-zinc-100'
                            : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Formato 24h</span>
            <button
              type="button"
              onClick={() => {
                onChange(`${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`);
                setIsOpen(false);
              }}
              className="text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-1.5 rounded-md hover:opacity-90 transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
