interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-bg-surface)] rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--color-danger-50)] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-500)" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Error</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">No se pudo completar la operación</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-primary)] mb-6 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full btn btn-primary btn-md"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
