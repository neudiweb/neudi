import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function BusinessPage() {
  const { slug } = useParams<{ slug: string }>();

  // Mock data - in production this would come from the API
  const business = {
    name: 'Peluquería Juan',
    description: 'Estilo y cuidado profesional para cada persona. Más de 10 años de experiencia.',
    address: 'Av. Corrientes 1234, CABA',
    phone: '+54 9 11 2345-6789',
    services: [
      { name: 'Corte de cabello clásico', duration: '30 min', price: '$5.000' },
      { name: 'Corte + barba', duration: '45 min', price: '$7.500' },
      { name: 'Coloración profesional', duration: '90 min', price: '$15.000' },
    ],
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" strokeLinecap="round" />
              <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver a Neudi
          </a>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">N</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">{business.name}</h1>
        <p className="mt-2 text-sm text-neutral-500 max-w-lg leading-relaxed">{business.description}</p>

        {/* Contact info */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-500">
          {business.address && (
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {business.address}
            </span>
          )}
          {business.phone && (
            <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 text-accent-600 hover:text-accent-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {business.phone}
            </a>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        <h2 className="text-sm font-medium text-neutral-500 mb-4 uppercase tracking-wider">Servicios</h2>
        <div className="space-y-3">
          {business.services.map((service, i) => (
            <div key={i} className="card p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">{service.name}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{service.duration}</p>
              </div>
              <span className="text-sm font-semibold text-neutral-900">{service.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <a href={`/book/${slug}`} className="btn btn-primary btn-lg w-full text-center gap-2">
          Reservar turno
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-neutral-400">Powered by Neudi</p>
        </div>
      </footer>
    </div>
  );
}
