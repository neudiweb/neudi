import { supabase, type Service, type Business, type BusinessHour } from '@/lib';
import type { TimeRange } from '../types';

export interface BusinessData {
  slug: string;
  name: string;
  description: string;
  address: string;
  city: string;
  timezone: string;
  currency: string;
  logoUrl?: string;
  services: Service[];
  businessHours: { dayOfWeek: number; ranges: TimeRange[] }[];
}

export async function getBusiness(slug: string): Promise<BusinessData | null> {
  if (!slug) return null;

  // First get the business to get its ID
  const { data: biz, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single() as { data: Business | null; error: unknown };

  if (bizError || !biz) return null;

  // Now fetch services and hours for this business
  const [servicesResult, hoursResult] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('business_id', biz.id)
      .order('name', { ascending: true }) as any,
    supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', biz.id) as any,
  ]);

  const servicesList: any = (servicesResult.data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? undefined,
    durationMinutes: s.duration_minutes,
    price: s.price,
  }));

  // Group hours by day_of_week and create ranges
  const hoursByDay = new Map<number, TimeRange[]>();
  
  for (const h of (hoursResult.data || [])) {
    const day = h.day_of_week;
    if (!hoursByDay.has(day)) {
      hoursByDay.set(day, []);
    }
    const ranges = hoursByDay.get(day)!;
    ranges.push({
      id: h.id,
      startTime: h.start_time,
      endTime: h.end_time,
      isActive: h.is_active,
    });
  }

  const hoursList: { dayOfWeek: number; ranges: TimeRange[] }[] = Array.from(hoursByDay.entries()).map(([dayOfWeek, ranges]) => ({
    dayOfWeek,
    ranges,
  }));

  return {
    slug: biz.slug,
    name: biz.name,
    description: biz.description ?? '',
    address: biz.address ?? '',
    city: biz.city ?? '',
    timezone: biz.timezone ?? 'America/Argentina/Buenos_Aires',
    currency: biz.currency ?? 'ARS',
    logoUrl: biz.logo_url ?? undefined,
    services: servicesList,
    businessHours: hoursList,
  };
}
