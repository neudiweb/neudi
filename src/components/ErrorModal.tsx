interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl max-w-md w-full border border-[var(--color-border-primary)] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Error</h3>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">No se pudo completar la operación</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-primary)] mb-6 leading-relaxed bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-primary)]">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
