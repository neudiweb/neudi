/**
 * Validación y generación de slugs — fuente única de verdad.
 * (Antes duplicadas en AuthContext.tsx, authService.ts y RegisterPage.tsx)
 */

/** Valida un correo electrónico con una regex simple. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Genera un slug URL-safe a partir del nombre de un negocio. */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
