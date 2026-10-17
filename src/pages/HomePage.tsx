import * as React from 'react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <Link to="/register" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 bg-accent-50 border border-accent-200 rounded-full px-4 py-1.5 mb-6 hover:bg-accent-100 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              Sistema de turnos gratuito para tu negocio
            </Link>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.1]">
              Turnos online que{' '}
              <span className="bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent">
                simplifican tu día
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Neudi permite que tus clientes reserven turnos 24/7 sin llamadas ni mensajes. 
              Vos gestionás todo desde un panel simple.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="btn btn-primary btn-lg w-full sm:w-auto gap-2">
                Empezar gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#como-funciona" className="btn btn-secondary btn-lg w-full sm:w-auto">
                ¿Cómo funciona?
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success-500">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sin tarjeta de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success-500">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Configuración en 5 min
              </span>
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-96 bg-gradient-to-b from-transparent via-accent-50/30 to-transparent pointer-events-none" />
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Todo lo que necesitás, nada que no
            </h2>
            <p className="mt-3 text-[var(--color-text-secondary)] max-w-xl mx-auto">
              Neudi se encarga de la gestión de turnos para que vos puedas enfocarte en tu negocio.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Calendario inteligente',
                desc: 'Tus clientes ven los horarios disponibles y reservan al instante. Sin conflictos ni solapamientos.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                title: 'Gestión de clientes',
                desc: 'Historial de visitas, preferencias y datos de contacto de cada cliente en un solo lugar.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0 2-2h-2" />
                    <rect x="9" y="5" width="6" height="3" rx="1" />
                  </svg>
                ),
                title: 'Servicios personalizables',
                desc: 'Configurá servicios, duración, precios y opciones como seña o depósito.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Horarios flexibles',
                desc: 'Definí horarios por día, feriados y períodos especiales fácilmente.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: 'Página de reserva',
                desc: 'Cada negocio tiene su página personalizada para que los clientes reserven online.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: 'Fácil de usar',
                desc: 'Interfaz intuitiva tanto para vos como para tus clientes. Sin curva de aprendizaje.',
              },
            ].map((item, i) => (
              <div key={i} className="card card-hover p-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-surface)] flex items-center justify-center text-[var(--color-text-secondary)] mb-4">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--color-bg-primary)] rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                ¿Listo para simplificar tu negocio?
              </h2>
              <p className="text-[var(--color-text-secondary)] max-w-md mx-auto mb-8">
                Creá tu cuenta gratis y empezá a recibir turnos online en minutos.
              </p>
              <Link to="/register" className="btn btn-lg bg-white text-neutral-900 hover:bg-neutral-100 inline-flex items-center gap-2 font-medium">
                Crear mi cuenta gratuita
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-primary)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-text-primary)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-bold tracking-tight text-[var(--color-text-primary)]">Neudi</span>
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)]">© 2026 Neudi. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
