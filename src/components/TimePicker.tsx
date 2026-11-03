import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSave?: (newStartTime: string, newEndTime: string, jsDay: number, rangeIndex: number) => void;
  jsDay?: number;
  rangeIndex?: number;
  disabled?: boolean;
}

export function TimePicker({ startTime, endTime, onStartChange, onEndChange, onSave, jsDay, rangeIndex, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartHour, setTempStartHour] = useState(() => parseInt(startTime.split(':')[0]));
  const [tempStartMinute, setTempStartMinute] = useState(() => parseInt(startTime.split(':')[1]));
  const [tempEndHour, setTempEndHour] = useState(() => parseInt(endTime.split(':')[0]));
  const [tempEndMinute, setTempEndMinute] = useState(() => parseInt(endTime.split(':')[1]));
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempStartHour(parseInt(startTime.split(':')[0]));
      setTempStartMinute(parseInt(startTime.split(':')[1]));
      setTempEndHour(parseInt(endTime.split(':')[0]));
      setTempEndMinute(parseInt(endTime.split(':')[1]));
    }
  }, [isOpen, startTime, endTime]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [isOpen]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const formatTime = (h: number, m: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    const newStartTime = formatTime(tempStartHour, tempStartMinute);
    const newEndTime = formatTime(tempEndHour, tempEndMinute);
    
    onStartChange(newStartTime);
    onEndChange(newEndTime);
    
    if (onSave && jsDay !== undefined && rangeIndex !== undefined) {
      onSave(newStartTime, newEndTime, jsDay, rangeIndex);
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(true)}
          className={`flex items-center justify-between gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-xl border text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 focus-visible:outline-offset-2 w-full ${
            disabled
              ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
              : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-900 dark:text-zinc-100'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 dark:text-zinc-500 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="flex-1 text-center text-sm font-bold tabular-nums">{startTime}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400 dark:text-zinc-500 shrink-0">
            <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(true)}
          className={`flex items-center justify-between gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-xl border text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 focus-visible:outline-offset-2 w-full ${
            disabled
              ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
              : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-900 dark:text-zinc-100'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 dark:text-zinc-500 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="flex-1 text-center text-sm font-bold tabular-nums">{endTime}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400 dark:text-zinc-500 shrink-0">
            <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Editar horarios de franja"
        >
          <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-zinc-800 via-zinc-500 to-zinc-300 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500" />

            <div className="p-5">
              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
                  Franja horaria
                </h3>
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 rounded-xl">
                  <div className="text-center">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-0.5">Inicio</div>
                    <span className="text-xl font-bold text-white dark:text-zinc-900 tabular-nums tracking-wider">
                      {formatTime(tempStartHour, tempStartMinute)}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 dark:text-zinc-600 shrink-0">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-center">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-0.5">Fin</div>
                    <span className="text-xl font-bold text-white dark:text-zinc-900 tabular-nums tracking-wider">
                      {formatTime(tempEndHour, tempEndMinute)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start time selectors */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                  Hora de inicio
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 text-center">
                      Hora
                    </label>
                    <select
                      value={tempStartHour}
                      onChange={(e) => setTempStartHour(parseInt(e.target.value))}
                      className="w-full h-11 px-3 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 appearance-none cursor-pointer"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch mt-3" />
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 text-center">
                      Minuto
                    </label>
                    <select
                      value={tempStartMinute}
                      onChange={(e) => setTempStartMinute(parseInt(e.target.value))}
                      className="w-full h-11 px-3 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 appearance-none cursor-pointer"
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-5" />

              {/* End time selectors */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                  Hora de fin
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 text-center">
                      Hora
                    </label>
                    <select
                      value={tempEndHour}
                      onChange={(e) => setTempEndHour(parseInt(e.target.value))}
                      className="w-full h-11 px-3 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 appearance-none cursor-pointer"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch mt-3" />
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 text-center">
                      Minuto
                    </label>
                    <select
                      value={tempEndMinute}
                      onChange={(e) => setTempEndMinute(parseInt(e.target.value))}
                      className="w-full h-11 px-3 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 appearance-none cursor-pointer"
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <button
                ref={confirmRef}
                type="button"
                onClick={handleConfirm}
                className="w-full h-11 text-sm font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-150"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
