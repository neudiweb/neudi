import * as React from 'react';

export interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  stepComponent?: React.ReactNode;
}

export function GuidedTour({ steps, isOpen, onClose, currentStep: externalStep, onStepChange, stepComponent }: GuidedTourProps) {
  const [internalStep, setInternalStep] = React.useState(0);
  const step = externalStep !== undefined ? externalStep : internalStep;
  const [highlightRect, setHighlightRect] = React.useState<DOMRect | null>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const stepData = steps[step];

  React.useEffect(() => {
    if (!isOpen) {
      setInternalStep(0);
      return;
    }
    const timer = setTimeout(() => {
      const el = document.querySelector(stepData.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
        setOffset({ x: rect.left + rect.width / 2, y: rect.bottom + 16 });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, step]);

  React.useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && step < steps.length - 1) {
        const next = step + 1;
        setInternalStep(next);
        onStepChange?.(next);
      }
      if (e.key === 'ArrowLeft' && step > 0) {
        const prev = step - 1;
        setInternalStep(prev);
        onStepChange?.(prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, steps.length, onClose, onStepChange]);

  if (!isOpen || !stepData) return null;

  const isCenter = stepData.placement === 'center';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Highlight */}
      {!isCenter && highlightRect && (
        <div
          className="fixed z-[101] rounded-2xl ring-4 ring-blue-500/60 shadow-2xl shadow-blue-500/20 pointer-events-none"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      {/* Center mode: just dim everything, no highlight */}
      {isCenter && (
        <div className="fixed z-[101] pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
      )}

      {/* Tooltip card */}
      <div
        className={`fixed z-[102] w-full max-w-sm ${
          isCenter
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'top-[16px]'
        } left-4 sm:left-auto sm:right-4 sm:max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-zinc-50 to-zinc-100/50 dark:from-zinc-800/80 dark:to-zinc-900/50">
        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
          {step + 1} / {steps.length}
        </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Cerrar tour"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {stepComponent ? (
              stepComponent
            ) : (
              <>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2 tracking-tight">
                  {stepData.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {stepData.description}
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cerrar
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const next = step - 1;
                  setInternalStep(next);
                  onStepChange?.(next);
                }}
                disabled={step === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => {
                    const next = step + 1;
                    setInternalStep(next);
                    onStepChange?.(next);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Terminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
