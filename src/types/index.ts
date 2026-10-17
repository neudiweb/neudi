export type BusinessSlug = string;

export interface TimeRange {
  id?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
}

export interface BusinessHour {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ... 6=Saturday
  ranges: TimeRange[];
}

export interface Business {
  slug: BusinessSlug;
  name: string;
  description: string;
  address: string;
  city: string;
  timezone: string;
  currency: string;
  logoUrl?: string;
  services: Service[];
  businessHours: BusinessHour[];
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REQUIRES_DEPOSIT'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

// Lowercase variant for UI components
export type AppointmentStatusLower =
  | 'pending'
  | 'confirmed'
  | 'requires_deposit'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface BusinessHours {
  Monday: { open: boolean; start: string; end: string };
  Tuesday: { open: boolean; start: string; end: string };
  Wednesday: { open: boolean; start: string; end: string };
  Thursday: { open: boolean; start: string; end: string };
  Friday: { open: boolean; start: string; end: string };
  Saturday: { open: boolean; start: string; end: string };
  Sunday: { open: boolean; start: string; end: string };
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  businessSlug: BusinessSlug;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  customer: Customer;
  status: AppointmentStatus;
  expiresAt?: string; // ISO datetime
  createdAt: string; // ISO datetime
}

export interface BookingStep {
  label: string;
  step: number;
}

export type Slot = {
  time: string;
  available: boolean;
};
