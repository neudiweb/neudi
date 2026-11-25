import * as React from 'react';

export interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * Ícono centrado en caja roja (si se omite, se renderiza el icono trash por defecto).
   * Pasar `null` para no renderizar icono.
   */
  icon?: React.ReactNode;
}

const TrashIcon = (
  <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center mx-auto mb-4">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 dark:text-red-400">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7h14z" strokeLinecap="round" />
    </svg>
  </div>
);

/**
 * Diálogo de confirmación de eliminación (bottom-sheet en móvil, centrado en desktop).
 * Reproduce exactamente el markup del delete-confirm de DashboardServices.
 */
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancelar', onConfirm, onCancel, icon }: ConfirmDialogProps) {
  const resolvedIcon = icon === undefined ? TrashIcon : icon;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-x-4 bottom-8 z-[60] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
          <div className="p-6 text-center">
            {resolvedIcon}
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-2xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.97]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors active:scale-[0.97]"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
