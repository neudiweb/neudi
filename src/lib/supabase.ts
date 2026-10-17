import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan variables de entorno: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY son requeridas.'
  );
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          full_name: string | null;
        };
        Update: Partial<{
          full_name: string | null;
        }>;
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          address: string | null;
          city: string | null;
          phone: string | null;
          email: string | null;
          timezone: string;
          currency: string;
          logo_url: string | null;
          is_active: boolean;
          plan: 'FREE' | 'PRO';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          description: string | null;
          address: string | null;
          city: string | null;
          phone: string | null;
          email: string | null;
          timezone: string;
          currency: string;
          logo_url: string | null;
          is_active: boolean;
          plan?: 'FREE' | 'PRO';
        };
        Update: Partial<{
          name: string;
          slug: string;
          description: string | null;
          address: string | null;
          city: string | null;
          phone: string | null;
          email: string | null;
          timezone: string;
          currency: string;
          logo_url: string | null;
          is_active: boolean;
          plan: 'FREE' | 'PRO';
        }>;
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: 'OWNER' | 'ADMIN' | 'STAFF';
          created_at: string;
        };
        Insert: {
          business_id: string;
          user_id: string;
          role: 'OWNER' | 'ADMIN' | 'STAFF';
        };
        Update: Partial<{
          business_id: string;
          user_id: string;
          role: 'OWNER' | 'ADMIN' | 'STAFF';
        }>;
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          currency: string;
          is_active: boolean;
        };
        Update: Partial<{
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          currency: string;
          is_active: boolean;
        }>;
      };
      business_hours: {
        Row: {
          id: string;
          business_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
        };
        Update: Partial<{
          business_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
        }>;
      };
      appointments: {
        Row: {
          id: string;
          business_id: string;
          service_id: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          notes: string | null;
          start_at: string;
          end_at: string;
          status: 'PENDING' | 'CONFIRMED' | 'REQUIRES_DEPOSIT' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          service_id: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          notes: string | null;
          start_at: string;
          end_at: string;
          status: 'PENDING' | 'CONFIRMED' | 'REQUIRES_DEPOSIT' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
          expires_at: string | null;
        };
        Update: Partial<{
          business_id: string;
          service_id: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          notes: string | null;
          start_at: string;
          end_at: string;
          status: 'PENDING' | 'CONFIRMED' | 'REQUIRES_DEPOSIT' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
          expires_at: string | null;
        }>;
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          phone: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          name: string;
          phone: string;
          email: string | null;
        };
        Update: Partial<{
          business_id: string;
          name: string;
          phone: string;
          email: string | null;
        }>;
      };
      business_exceptions: {
        Row: {
          id: string;
          business_id: string;
          date: string;
          is_closed: boolean;
          start_time: string | null;
          end_time: string | null;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          date: string;
          is_closed: boolean;
          start_time: string | null;
          end_time: string | null;
          reason: string | null;
        };
        Update: Partial<{
          date: string;
          is_closed: boolean;
          start_time: string | null;
          end_time: string | null;
          reason: string | null;
        }>;
      };
      appointment_services: {
        Row: {
          id: string;
          appointment_id: string;
          service_id: string;
          price: number;
          duration_minutes: number;
          created_at: string;
        };
        Insert: {
          appointment_id: string;
          service_id: string;
          price: number;
          duration_minutes: number;
        };
        Update: Partial<{
          price: number;
          duration_minutes: number;
        }>;
      };
    };
    Functions: {
      get_available_slots: {
        Args: {
          p_business_slug: string;
          p_service_ids?: string[];
          p_date: string;
          p_exclude_appointment_id?: string;
        };
        Returns: Array<{ time: string; available: boolean }>;
      };
      get_available_slots_for_date: {
        Args: {
          p_business_id: string;
          p_date: string;
          p_service_ids?: string[] | null;
        };
        Returns: Array<{ time: string; available: boolean }>;
      };
      create_public_appointment: {
        Args: {
          p_business_slug: string;
          p_service_ids: string[];
          p_start_at: string;
          p_end_at: string;
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_email: string | null;
          p_notes: string | null;
          p_exclude_appointment_id: string | null;
        };
        Returns: { success: boolean; appointment_id?: string; message?: string; error?: string }[];
      };
      reschedule_appointment: {
        Args: {
          p_appointment_id: string;
          p_new_start_at: string;
          p_new_end_at: string;
        };
        Returns: { success: boolean; appointment_id?: string; status?: string; start_at?: string; end_at?: string; total_duration?: number; message?: string }[];
      };
      create_business_for_current_user: {
        Args: {
          p_name: string;
          p_slug: string;
          p_timezone: string;
          p_currency: string;
        };
        Returns: { business_id: string }[];
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'neudi-auth-token',
  },
});

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Business = Database['public']['Tables']['businesses']['Row'];
export type BusinessMember =
  Database['public']['Tables']['business_members']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type BusinessHour =
  Database['public']['Tables']['business_hours']['Row'];
export type Appointment =
  Database['public']['Tables']['appointments']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type BusinessException =
  Database['public']['Tables']['business_exceptions']['Row'];
