const NAGER_API = 'https://date.nager.at/api/v3/PublicHolidays';
const CACHE_KEY = 'neudi_holidays_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000;

export interface Holiday {
  date: string;
  name: string;
}

interface CacheEntry {
  data: Holiday[];
  timestamp: number;
}

function getCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function setCache(data: Holiday[]): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() } as CacheEntry)
    );
  } catch {
    // localStorage full or unavailable — continue without cache
  }
}

function isCacheValid(entry: CacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

export async function fetchHolidays(year: number): Promise<Holiday[]> {
  const response = await fetch(`${NAGER_API}/${year}/AR`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.map((h: { date: string; localName: string }) => ({
    date: h.date.split('T')[0],
    name: h.localName,
  }));
}

let fetchPromise: Promise<Holiday[]> | null = null;

export async function getUpcomingHolidays(): Promise<Holiday[]> {
  const cached = getCache();
  if (isCacheValid(cached)) {
    return cached!.data;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();

      const thisYear = await fetchHolidays(currentYear);
      if (thisYear.length > 0) {
        setCache(thisYear);
        return thisYear;
      }

      const nextYear = await fetchHolidays(currentYear + 1);
      setCache(nextYear);
      return nextYear;
    } catch (err) {
      console.error('[Neudi] Error fetching holidays:', err);
      const fallback = getCache();
      if (fallback && fallback.data) return fallback.data;
      return [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function clearHolidayCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
