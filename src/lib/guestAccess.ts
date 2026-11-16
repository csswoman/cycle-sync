/**
 * Routes that can be opened without an account (guest mode).
 * Everything else under the (app) group requires a session.
 */
export const GUEST_ROUTES = ['/dashboard', '/routines', '/nutrition', '/pmos'] as const;

export function isGuestRoute(pathname: string): boolean {
  return GUEST_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}
