import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import '../landing.css';

/* ═══════════════════════════════════════════════════════════
   Neudi — landing page ("Editorial Ledger")
   Appointment-ledger identity: warm paper in light mode,
   deep ink green-black in dark mode, one deep-green accent.
   ═══════════════════════════════════════════════════════════ */

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function getTodayLabel() {
  const d = new Date();
  const day = DAY_NAMES[d.getDay()];
  const date = d.getDate().toString().padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  return { day, date: `${date} ${month} ${d.getFullYear()}` };
}

/* ─── Theme toggle ─── */
function ThemeToggle({ isDark }: { isDark: boolean }) {
  const { setMode } = useTheme();
  return (
    <button
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--lp-hairline-strong)] bg-[var(--lp-surface)] text-[var(--lp-ink-2)] transition-all duration-200 hover:scale-105 hover:text-[var(--lp-accent)]"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

/* ─── Wordmark ─── */
function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Neudi — inicio">
      <span className="flex h-9 w-9 items-center justify-center bg-[var(--lp-accent)] text-[var(--lp-paper)] transition-transform duration-300 group-hover:-translate-y-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </span>
      <span className="lp-serif text-[1.35rem] leading-none font-semibold tracking-tight text-[var(--lp-ink)]">
        Neudi
      </span>
    </Link>
  );
}

/* ─── Section kicker (mono) ─── */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="lp-mono mb-5 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lp-accent)]">
      <span aria-hidden="true" className="inline-block h-px w-8 bg-[var(--lp-accent)]" />
      {children}
    </p>
  );
}

/* ─── Appointment ticket (the hero centerpiece) ─── */
function AppointmentTicket() {
  const { day, date } = getTodayLabel();
  return (
    <div className="lp-ticket relative w-full max-w-md" style={{ ['--lp-tilt' as string]: '1.5deg' }}>
      {/* stacked card behind */}
      <div
        aria-hidden="true"
        className="absolute inset-0 border border-[var(--lp-hairline)] bg-[var(--lp-surface-2)]"
        style={{ transform: 'translate(10px, 10px) rotate(-2.5deg)' }}
      />
      {/* ticket body */}
      <div className="relative overflow-hidden border border-[var(--lp-hairline-strong)] bg-[var(--lp-ticket)] text-[var(--lp-ink)] shadow-[var(--lp-shadow)]">
        {/* live strip */}
        <div className="flex items-center justify-between border-b border-[var(--lp-hairline)] px-6 py-3">
          <span className="lp-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--lp-ink-2)]">
            Ticket de turno
          </span>
          <span className="lp-mono flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--lp-ink-2)]">
            <span className="lp-blink inline-block h-1.5 w-1.5 rounded-full bg-[var(--lp-accent)]" />
            En vivo
          </span>
        </div>

        <div className="flex">
          {/* perforated stub */}
          <div className="relative hidden w-14 shrink-0 sm:block">
            <div className="absolute right-0 top-0 h-full w-[14px] lp-perforation border-r border-dashed border-[var(--lp-hairline-strong)]" />
            <div className="flex h-full items-center justify-center">
              <span className="lp-mono rotate-180 text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--lp-ink-3)] [writing-mode:vertical-rl]">
                Turno #0142
              </span>
            </div>
          </div>

          {/* ticket content */}
          <div className="flex-1 px-6 py-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="lp-serif text-4xl font-medium leading-none tracking-tight sm:text-[2.6rem]">
                  {day}
                </p>
                <p className="lp-mono mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--lp-ink-2)]">
                  {date}
                </p>
              </div>
              <div className="text-right">
                <p className="lp-mono text-xl font-semibold tracking-tight text-[var(--lp-accent)] sm:text-2xl">
                  10:30—11:00
                </p>
                <p className="lp-mono mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--lp-ink-3)]">
                  30 min
                </p>
              </div>
            </div>

            <div className="my-5 border-t border-dashed border-[var(--lp-hairline-strong)]" />

            <dl className="grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="lp-mono text-[10px] uppercase tracking-[0.2em] text-[var(--lp-ink-3)]">Servicio</dt>
                <dd className="lp-serif text-base font-medium text-[var(--lp-ink)]">Corte + Barba</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="lp-mono text-[10px] uppercase tracking-[0.2em] text-[var(--lp-ink-3)]">Cliente</dt>
                <dd className="lp-mono text-sm font-medium text-[var(--lp-ink)]">María López</dd>
              </div>
            </dl>

            <div className="mt-5">
              <span className="lp-mono inline-flex items-center gap-2 border border-[var(--lp-accent)] bg-[var(--lp-accent-soft)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--lp-accent)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--lp-accent)]" />
                Confirmado
              </span>
            </div>

            <div className="mt-6 border-t border-[var(--lp-hairline)] pt-4">
              <div aria-hidden="true" className="lp-barcode h-9 w-full text-[var(--lp-ink-2)] opacity-70" />
              <p className="lp-mono mt-3 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--lp-ink-3)]">
                www.neudi.app/turnos/0142
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Data ─── */
const FEATURES = [
  {
    index: '01',
    tag: 'agenda',
    title: 'Agenda en tiempo real',
    desc: 'Cada turno confirmado, cancelado o movido aparece en todas las pantallas al instante. Sin actualizar nada a mano.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    index: '02',
    tag: 'turnos',
    title: 'Reservas 24/7',
    desc: 'Tus clientes reservan desde el celular cuando quieran, incluso de madrugada. Sin vos atendiendo el teléfono.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    index: '03',
    tag: 'clientes',
    title: 'Clientes siempre al día',
    desc: 'Historial de visitas, preferencias y datos de contacto de cada cliente, centralizado en un solo lugar.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    index: '04',
    tag: 'servicios',
    title: 'Precios y servicios',
    desc: 'Cargá servicios con duración, precio y opciones como seña o depósito. Sin hojas de cálculo ni sumas manuales.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="5" width="6" height="3" rx="1" />
      </svg>
    ),
  },
];

const STEPS = [
  { index: '01', title: 'Creá tu cuenta', desc: '30 segundos.' },
  { index: '02', title: 'Cargá tus servicios', desc: 'Horarios, precios y duración — todo en minutos.' },
  { index: '03', title: 'Compartí tu link', desc: 'Tus clientes lo usan desde cualquier celular, 24/7.' },
];

const INDUSTRIES = [
  'Peluquerías',
  'Gimnasios',
  'Consultorios',
  'Talleres',
  'Clases',
  'Restaurantes',
  'Estudios',
  'Asesorías',
];

const STATS = [
  { value: '24/7', label: 'Turnos automáticos' },
  { value: '5 min', label: 'De configuración' },
  { value: '0', label: 'Llamadas perdidas' },
  { value: '1', label: 'Link para toda tu agenda' },
];

export function HomePage() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  return (
    <div className="landing min-h-screen transition-colors duration-500">
      {/* ══════════ HEADER ══════════ */}
      <header className="sticky top-0 z-50 border-b border-[var(--lp-hairline)] bg-[var(--lp-paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Wordmark />
          <nav aria-label="Secciones" className="hidden items-center gap-8 md:flex">
            {[
              { label: 'Funcionalidades', href: '#funcionalidades' },
              { label: 'Cómo funciona', href: '#como-funciona' },
              { label: 'Datos', href: '#datos' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--lp-ink-2)] transition-colors hover:text-[var(--lp-accent)]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle isDark={isDark} />
            <Link
              to="/register"
              className="lp-mono inline-flex items-center gap-2 bg-[var(--lp-accent)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--lp-paper)] transition-all duration-200 hover:opacity-90 active:scale-[0.98] sm:px-5"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ══════════ HERO ══════════ */}
        <section className="relative overflow-hidden">
          <div className="lp-grid-bg absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              {/* copy */}
              <div className="max-w-xl">
                <p
                  className="lp-mono mb-6 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--lp-ink-2)]"
                >
                  <span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-[var(--lp-accent)]" />
                  Turnos online — para negocios de servicios
                </p>

                <h1
                  className="lp-serif text-[2.6rem] font-medium leading-[1.08] tracking-tight text-[var(--lp-ink)] sm:text-6xl lg:text-[4.2rem]"
                >
                  Reservar no debería{' '}
                  <em className="font-normal text-[var(--lp-accent)]">ser un trabajo.</em>
                </h1>

                <p
                  className="mt-7 max-w-lg text-base leading-relaxed text-[var(--lp-ink-2)] sm:text-lg"
                >
                  Neudi publica tu agenda online en minutos. Tus clientes reservan 24/7 y vos administrás todo
                  desde un panel simple.
                </p>

                <div
                  className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <Link
                    to="/register"
                    className="lp-pulse group inline-flex items-center justify-center gap-2.5 bg-[var(--lp-accent)] px-7 py-4 text-sm font-semibold text-[var(--lp-paper)] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  >
                    Crear mi cuenta gratis
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center justify-center gap-2 border border-[var(--lp-hairline-strong)] bg-[var(--lp-surface)] px-6 py-4 text-sm font-semibold text-[var(--lp-ink)] transition-colors duration-200 hover:border-[var(--lp-accent)] hover:text-[var(--lp-accent)]"
                  >
                    Cómo funciona
                  </a>
                </div>

                <ul
                  className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2"
                >
                  {['Gratis', 'Sin tarjeta', 'Listo en 5 min'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-[var(--lp-accent)]" />
                      <span className="lp-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--lp-ink-2)]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ticket */}
              <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
                <AppointmentTicket />
                <p className="lp-mono mt-5 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--lp-ink-3)] lg:text-right">
                  Ejemplo de ticket de turno
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ INDUSTRIES MARQUEE ══════════ */}
        <section aria-label="Sectores que trabajan con Neudi" className="border-y border-[var(--lp-hairline)] bg-[var(--lp-surface-2)]/60">
          <div className="lp-marquee relative overflow-hidden py-4">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[var(--lp-surface-2)] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[var(--lp-surface-2)] to-transparent" />
            <div className="lp-marquee-track flex w-max items-center gap-10 whitespace-nowrap">
              {[...INDUSTRIES, ...INDUSTRIES].map((industry, i) => (
                <span key={i} className="lp-mono flex items-center gap-10 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--lp-ink-2)]">
                  {industry}
                  <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--lp-accent)]" />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ FEATURES ══════════ */}
        <section id="funcionalidades" className="relative scroll-mt-24">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Kicker>Funcionalidades</Kicker>
                <h2 className="lp-serif max-w-xl text-3xl font-medium leading-[1.12] tracking-tight text-[var(--lp-ink)] sm:text-5xl">
                  Todo lo que tu negocio necesita.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-[var(--lp-ink-2)] sm:text-base">
                No es un SaaS genérico. Es una agenda que trabaja sola — vos seguís atendiendo clientes.
              </p>
            </div>

            <div className="mt-12 border-t border-[var(--lp-hairline-strong)]">
              {FEATURES.map((feature) => (
                <article
                  key={feature.index}
                  className="lp-feature-row grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-3 border-b border-[var(--lp-hairline)] px-2 py-6 sm:grid-cols-[64px_1fr_120px] sm:gap-x-8 sm:px-4 sm:py-7"
                >
                  <span className="lp-mono lp-feature-index pt-1 text-sm font-semibold tracking-[0.2em] text-[var(--lp-ink-3)] transition-colors">
                    {feature.index}
                  </span>
                  <div className="flex items-start gap-4 sm:gap-6">
                    <span className="lp-feature-cell-icon mt-1 hidden shrink-0 text-[var(--lp-ink-2)] sm:block">
                      {feature.icon}
                    </span>
                    <div>
                      <h3 className="lp-serif text-xl font-medium tracking-tight text-[var(--lp-ink)] sm:text-2xl">
                        {feature.title}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--lp-ink-2)] sm:text-[15px]">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                  <span className="lp-mono col-start-2 row-start-2 self-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--lp-ink-3)] sm:col-start-3 sm:row-start-1 sm:text-right">
                    {feature.tag}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section id="como-funciona" className="border-t border-[var(--lp-hairline)]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <Kicker>Cómo funciona</Kicker>
            <h2 className="lp-serif text-3xl font-medium leading-[1.12] tracking-tight text-[var(--lp-ink)] sm:text-5xl">
              Empezá en 3 pasos.
            </h2>

            <div className="mt-12 grid gap-px border border-[var(--lp-hairline)] bg-[var(--lp-hairline)] sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.index} className="flex h-full flex-col justify-between gap-8 bg-[var(--lp-paper)] p-7 sm:p-8">
                  <span className="lp-serif text-5xl font-medium italic tracking-tight text-[var(--lp-accent)] sm:text-6xl">
                    {step.index}
                  </span>
                  <div>
                    <h3 className="lp-serif text-xl font-medium tracking-tight text-[var(--lp-ink)] sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--lp-ink-2)]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ STATS ══════════ */}
        <section id="datos" className="border-t border-[var(--lp-hairline)] bg-[var(--lp-surface)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <p className="lp-mono text-4xl font-semibold tracking-tight text-[var(--lp-ink)] sm:text-5xl lg:text-[3.4rem]">
                    {stat.value}
                  </p>
                  <div aria-hidden="true" className="mt-3 h-px w-10 bg-[var(--lp-accent)]" />
                  <p className="lp-mono mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--lp-ink-2)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section className="border-t border-[var(--lp-hairline)]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="relative overflow-hidden border border-[var(--lp-hairline-strong)] bg-[var(--lp-surface)] px-6 py-12 text-center sm:px-12 sm:py-16">
              <div aria-hidden="true" className="lp-grid-bg absolute inset-0 opacity-[0.35]" />
              <div className="relative">
                <p className="lp-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--lp-accent)]">
                  Empezá en 5 minutos
                </p>
                <h2 className="lp-serif mx-auto mt-5 max-w-2xl text-4xl font-medium leading-[1.05] tracking-tight text-[var(--lp-ink)] sm:text-6xl">
                  Tu negocio, <em className="font-normal text-[var(--lp-accent)]">a la orden.</em>
                </h2>
                <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[var(--lp-ink-2)]">
                  Creá tu cuenta y empezá a recibir turnos online en minutos. Gratis, sin tarjeta.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2.5 bg-[var(--lp-accent)] px-8 py-4 text-sm font-semibold text-[var(--lp-paper)] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  >
                    Crear mi cuenta gratis
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="lp-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--lp-ink-2)] transition-colors hover:text-[var(--lp-accent)]"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-[var(--lp-hairline)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center bg-[var(--lp-accent)] text-[var(--lp-paper)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </span>
            <span className="lp-serif text-lg font-semibold tracking-tight text-[var(--lp-ink)]">Neudi</span>
          </div>
          <nav aria-label="Footer" className="flex items-center gap-6">
            <Link to="/login" className="lp-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--lp-ink-2)] transition-colors hover:text-[var(--lp-accent)]">
              Iniciar sesión
            </Link>
            <Link to="/register" className="lp-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--lp-ink-2)] transition-colors hover:text-[var(--lp-accent)]">
              Registrarse
            </Link>
          </nav>
          <p className="lp-mono text-[10px] uppercase tracking-[0.18em] text-[var(--lp-ink-3)]">
            © 2026 Neudi · Buenos Aires
          </p>
        </div>
      </footer>
    </div>
  );
}
