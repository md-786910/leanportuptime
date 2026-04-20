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

/**
 * Returns true if the current user is the original workspace owner
 * (admin without an inviter). Invited admins share admin privileges
 * but cannot connect or disconnect the shared Google OAuth connection.
 */
export function useIsOwner() {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'admin' && !user?.invitedBy;
}
