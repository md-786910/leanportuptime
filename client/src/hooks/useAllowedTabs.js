import { useAuthStore } from '../store/authStore';
import { SITE_TAB_KEYS } from '../constants/tabs';

export function useAllowedTabs(siteId) {
  const user = useAuthStore((s) => s.user);
  if (!user) return SITE_TAB_KEYS;
  if (user.role === 'admin') return SITE_TAB_KEYS;

  const map = user.sharedSiteTabs;
  if (!map || !siteId) return SITE_TAB_KEYS;

  const entry = map[String(siteId)];
  if (!entry || !entry.length) return SITE_TAB_KEYS;
  return entry.filter((t) => SITE_TAB_KEYS.includes(t));
}
