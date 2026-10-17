import * as React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import AppearanceSettings from '../../components/ui/AppearanceSettings';

export function DashboardSettings() {
  const [saved, setSaved] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout currentTab="settings">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Configuración</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Información de tu negocio</p>
      </div>

      {/* Success message */}
      {saved && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Configuración guardada correctamente.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        <Input id="businessName" label="Nombre del negocio" placeholder="Peluquería Juan" defaultValue="Peluquería Juan" />
        <Input id="ownerName" label="Nombre del titular" placeholder="Juan Pérez" defaultValue="Juan Pérez" />
        <Input id="email" type="email" label="Email de contacto" placeholder="contacto@peluqueriajuan.com" defaultValue="info@peluqueriajuan.com" />
        <Input id="phone" type="tel" label="Teléfono" placeholder="+54 9 11 2345-6789" defaultValue="+54 9 11 2345-6789" />
        <Input id="address" label="Dirección" placeholder="Av. Corrientes 1234, CABA" defaultValue="Av. Corrientes 1234, CABA" />

        {/* Booking URL */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Link de reserva</label>
          <div className="flex gap-2">
            <Input
              value="https://neudi.app/peluqueria-juan"
              readOnly
              className="bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] font-mono text-xs"
            />
            <Button variant="secondary" type="button" className="btn-md shrink-0">Copiar</Button>
          </div>
        </div>

        {/* Save */}
        <div className="pt-2">
          <Button type="submit" className="btn-md gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
            Guardar cambios
          </Button>
        </div>
      </form>

      {/* Appearance */}
      <div className="mt-10 max-w-lg">
        <h2 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">Apariencia</h2>
        <div className="card p-6">
          <AppearanceSettings />
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-10 max-w-lg">
        <h2 className="text-sm font-medium text-red-500 mb-3">Zona de peligro</h2>
        <div className="card border-red-500/30 p-5">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">Eliminar tu cuenta es irreversible. Todos los datos de tu negocio serán eliminados permanentemente.</p>
          <Button variant="danger" className="btn-md">Eliminar cuenta</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
