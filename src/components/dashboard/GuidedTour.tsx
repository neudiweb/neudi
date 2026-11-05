import * as React from 'react';

export interface TourStep {
  target: string;
  title: string;
  description: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

function getCardPosition(
  rect: DOMRect,
  viewportW: number,
  viewportH: number
): { top: number; left: number } {
  const cardW = 380;
  const cardH = 220;
  const gap = 24;

  const elCenterX = rect.left + rect.width / 2;
  const elBottom = rect.bottom;
  const elTop = rect.top;

  const belowY = elBottom + gap;
  const aboveY = elTop - gap - cardH;

  let top: number;

  if (belowY + cardH <= viewportH) {
    top = belowY;
  } else if (aboveY >= 0) {
    top = aboveY;
  } else {
    top = Math.max(16, viewportH - cardH - 16);
  }

  let left = Math.max(16, Math.min(elCenterX - cardW / 2, viewportW - cardW - 16));
  left = Math.min(left, viewportW - cardW - 8);

  return { top, left };
}

export function GuidedTour({ steps, isOpen, onClose, currentStep: externalStep, onStepChange }: GuidedTourProps) {
  const [internalStep, setInternalStep] = React.useState(0);
  const step = externalStep !== undefined ? externalStep : internalStep;
  const [cardStyle, setCardStyle] = React.useState<{ top: number; left: number }>({
    top: 80,
    left: 16,
  });
  const [highlightRect, setHighlightRect] = React.useState<DOMRect | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

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
        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        setCardStyle(getCardPosition(rect, vpW, vpH));
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [isOpen, step, stepData?.target]);

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

  const handleNav = (dir: 'prev' | 'next') => {
    const next = dir === 'next' ? step + 1 : step - 1;
    if (next < 0 || next >= steps.length) return;
    setInternalStep(next);
    onStepChange?.(next);
  };

  if (!isOpen || !stepData || !highlightRect) return null;

  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const clipPath = `inset(
    ${highlightRect.top}px round 16px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top}px,
    ${window.innerHeight - highlightRect.bottom}px round 16px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.bottom}px,
    ${highlightRect.left}px round 16px at ${highlightRect.left}px ${highlightRect.top + highlightRect.height / 2}px,
    ${window.innerWidth - highlightRect.right}px round 16px at ${highlightRect.right}px ${highlightRect.top + highlightRect.height / 2}px
  )`;

  return (
    <>
      {/* Overlay with cutout using clip-path */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 transition-all duration-300"
        style={{ clipPath }}
        onClick={onClose}
      />

      {/* Highlight border */}
      <div
        className="fixed z-[101] rounded-2xl ring-2 ring-blue-500/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
        style={{
          top: highlightRect.top,
          left: highlightRect.left,
          width: highlightRect.width,
          height: highlightRect.height,
          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="fixed z-[102] w-[380px] max-w-[calc(100vw-32px)]"
        style={{
          top: cardStyle.top,
          left: cardStyle.left,
          transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">
              {step + 1} <span className="text-zinc-300 dark:text-zinc-600">/</span> {steps.length}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Cerrar tutorial"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-1.5 tracking-tight">
              {stepData.title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {stepData.description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cerrar
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleNav('prev')}
                disabled={isFirst}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:dark:border-zinc-800"
              >
                Anterior
              </button>
              <button
                onClick={() => handleNav('next')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
              >
                {isLast ? 'Terminar' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
