import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { STATUS_LABELS } from '@/utils/status';
import { formatDate } from '@/utils/dateTime';
import type { AppointmentStatusLower, SelectedAppointment } from '@/types/index';

interface AppointmentDrawerProps {
  appointment: SelectedAppointment;
  bizTimezone: string;
  onClose: () => void;
  onReschedule: (appointment: SelectedAppointment) => void;
  onUpdateStatus: (id: string, status: AppointmentStatusLower) => void;
}

export function AppointmentDrawer({
  appointment,
  bizTimezone,
  onClose,
  onReschedule,
  onUpdateStatus,
}: AppointmentDrawerProps) {
  return (
        <Modal
      shellClassName="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      backdropClassName="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onBackdropClick={() => onClose()}
      panelClassName="relative w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto border-l border-zinc-200 dark:border-zinc-800"
    >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Detalle del turno</h2>
          <button
            onClick={() => onClose()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Client info */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Cliente</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-600 to-zinc-800 dark:from-zinc-300 dark:to-zinc-500 flex items-center justify-center text-white font-semibold shrink-0 shadow-lg">
                {appointment.clientName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{appointment.clientName}</p>
                <div className="flex items-center gap-2">
                  <a href={`tel:${appointment.clientPhone}`} className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                    {appointment.clientPhone}
                  </a>
                  <a
                    href={`https://wa.me/${appointment.clientPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hola ${appointment.clientName}, recordá que el día ${formatDate(appointment.date, bizTimezone)} a las ${appointment.time} tenés turno para: ${appointment.serviceNames}. ¡Te esperamos!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                    title="Enviar WhatsApp"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Service info */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Servicios</h3>
            {appointment.serviceDetails?.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between py-2 text-sm">
                <span className="text-zinc-900 dark:text-zinc-100">{svc.name}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">${svc.price.toLocaleString('es-AR')}</span>
              </div>
            ))}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-sm">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Total</span>
              <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">${appointment.totalPrice.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" strokeLinecap="round" />
                </svg>
                {appointment.totalDuration} min ({Math.floor(appointment.totalDuration / 60)}h{appointment.totalDuration % 60 > 0 ? ` ${appointment.totalDuration % 60}m` : ''})
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="px-4 py-2 border-y border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
              <span>Creación: {appointment.createdAt ? new Date(appointment.createdAt).toLocaleString('es-AR') : '—'}</span>
              <span>Modificación: {appointment.updatedAt ? new Date(appointment.updatedAt).toLocaleString('es-AR') : '—'}</span>
            </div>
          </div>

          {/* Time info */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Horario</h3>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{appointment.time}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Inicio</p>
              </div>
              <div className="flex-1 flex items-center justify-center px-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(border-zinc-200 dark:border-zinc-800)]">
                  <path d="M5 12h14" strokeLinecap="round" />
                  <path d="M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{appointment.endTime}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Fin</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Estado</h3>
            <Badge variant={appointment.status === 'confirmed' ? 'success' : appointment.status === 'completed' || appointment.status === 'no_show' ? 'success' : appointment.status === 'pending' ? 'warning' : 'default'}>
              {STATUS_LABELS[appointment.status]}
            </Badge>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
              <button
                onClick={() => onReschedule(appointment)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6v6M23 20v-6V4" />
                  <path d="M5.63 20.21a8 8 0 0 1 0-11.71" />
                  <path d="M18.37 20.21a8 8 0 0 0 0-11.71" />
                  <path d="M7.59 7.59A8 8 0 0 1 16.41 7.59" />
                  <path d="M16.41 16.41A8 8 0 0 1 7.59 16.41" />
                </svg>
                Reagendar turno
              </button>
            )}
            {(appointment.status === 'pending' || appointment.status === 'requires_deposit') && (
              <>
                <button
                  onClick={() => { onUpdateStatus(appointment.id, 'confirmed'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-300/20 dark:shadow-zinc-900/30 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Confirmar turno
                </button>
                <button
                  onClick={() => { onUpdateStatus(appointment.id, 'cancelled'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                  </svg>
                  Cancelar turno
                </button>
              </>
            )}
            {appointment.status === 'confirmed' && (
              <>
                <button
                  onClick={() => { onUpdateStatus(appointment.id, 'completed'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Marcar como completado
                </button>
                <button
                  onClick={() => { onUpdateStatus(appointment.id, 'no_show'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                  </svg>
                  Marcar como no asistió
                </button>
              </>
            )}
            {appointment.status === 'completed' && (
              <button
                onClick={() => { onUpdateStatus(appointment.id, 'no_show'); onClose(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                </svg>
                Marcar como no asistió
              </button>
            )}
            {appointment.status === 'no_show' && (
              <>
                <button
                  onClick={() => { onUpdateStatus(appointment.id, 'confirmed'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6v6M23 20v-6V4" />
                  </svg>
                  Revertir a confirmado
                </button>
                <button
                  onClick={() => { onUpdateStatus(appointment.id, 'completed'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Marcar como completado
                </button>
              </>
            )}
          </div>
        </div>
    </Modal>
  );
}
