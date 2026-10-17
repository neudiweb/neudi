import { useState, useCallback } from 'react';

export interface BookingState {
  serviceId: string | null;
  date: string | null;
  time: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes: string;
}

const STORAGE_KEY = 'neudi-booking';

export function useBookingState() {
  const [state, setState] = useState<BookingState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { serviceId: null, date: null, time: null, customerName: '', customerPhone: '', customerEmail: '', customerNotes: '' };
  });

  const update = useCallback((partial: Partial<BookingState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState({ serviceId: null, date: null, time: null, customerName: '', customerPhone: '', customerEmail: '', customerNotes: '' });
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { state, update, reset };
}
