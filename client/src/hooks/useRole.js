import { useAuthStore } from '../store/authStore';

/**
 * Returns true if the current user is a viewer (read-only role).
 * Viewers cannot trigger mutations like refreshing backlinks,
 * linking/unlinking Google properties, or editing app settings.
 */
export function useIsViewer() {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'viewer';
}

/**
 * Returns true if the current user has admin privileges.
 */
export function useIsAdmin() {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'admin';
}
