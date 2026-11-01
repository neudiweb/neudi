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

  useEffect(() => {
    if (!isOpen) {
      setTempHour(parseInt(value.split(':')[0]));
      setTempMinute(parseInt(value.split(':')[1]));
    }
  }, [value, isOpen]);

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

  const handleConfirm = () => {
    onChange(`${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-xl border text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 focus-visible:outline-offset-2 w-full ${
          disabled
            ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
            : isOpen
              ? 'border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/20 dark:ring-zinc-100/20 bg-white dark:bg-zinc-900'
              : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-900 dark:text-zinc-100'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 dark:text-zinc-500 shrink-0">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="flex-1 text-center text-sm font-bold tabular-nums">{formatDisplay()}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform shrink-0 text-zinc-400 dark:text-zinc-500 ${isOpen ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-4 w-full min-w-[220px]">
          {/* Preview */}
          <div className="text-center mb-4 py-3 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 rounded-lg">
            <span className="text-3xl font-bold text-white dark:text-zinc-900 tabular-nums tracking-wider">{formatDisplay()}</span>
          </div>

          {/* Two selects */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5 text-center">
                Hora
              </label>
              <select
                value={tempHour}
                onChange={(e) => setTempHour(parseInt(e.target.value))}
                className="w-full h-10 px-3 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 appearance-none cursor-pointer"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch" />

            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5 text-center">
                Minuto
              </label>
              <select
                value={tempMinute}
                onChange={(e) => setTempMinute(parseInt(e.target.value))}
                className="w-full h-10 px-3 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 appearance-none cursor-pointer"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full h-10 text-sm font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-colors"
          >
            Listo
          </button>
        </div>
      )}
    </div>
  );
}
