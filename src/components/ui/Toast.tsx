import * as React from 'react';

export interface ToastProps {
  /** Visual variant — drives colors and icon. */
  variant?: 'success' | 'error';
  /** Position of the toast in the viewport. */
  position?: 'center' | 'top-right';
  /** Title text. */
  title: string;
  /** Optional message rendered below the title (React node). */
  message?: React.ReactNode;
  /** Fired when the toast's close button is clicked. Omit to render no button. */
  onClose?: () => void;
  /** data-testid on the outer wrapper. */
  testId?: string;
}

/**
 * Shared toast — éxito/info centrado o alerta de error arriba a la derecha.
 * Reproduce exactamente el markup de los toasts inline existentes en
 * DashboardAgenda / DashboardServices.
 */
export function Toast({ variant = 'success', position = 'center', title, message, onClose, testId }: ToastProps) {
  if (position === 'top-right') {
    return (
      <div
        className="fixed top-4 right-4 z-[100] max-w-sm animate-in fade-in slide-in-from-top-2"
        style={{ animation: 'toastIn 0.3s ease-out' }}
        data-testid={testId}
      >
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800/50 rounded-2xl shadow-xl shadow-red-500/5 dark:shadow-red-500/10 p-5 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md shadow-red-500/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
            {message && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{message}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  const isSuccess = variant === 'success';
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4"
      data-testid={testId}
    >
      <div className="max-w-sm w-full" style={{ animation: 'toastIn 0.3s ease-out' }}>
        <div
          className={
            isSuccess
              ? 'bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800/50 rounded-2xl shadow-xl shadow-green-500/10 dark:shadow-green-500/20 p-6 flex items-center gap-4'
              : 'bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800/50 rounded-2xl shadow-xl shadow-red-500/10 dark:shadow-red-500/20 p-6 flex items-center gap-4'
          }
        >
          <div
            className={
              isSuccess
                ? 'flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md shadow-green-500/20'
                : 'flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md shadow-red-500/20'
            }
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isSuccess ? (
                <path d="M20 6L9 17l-5-5" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </>
              )}
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
            {message && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
