const KEYS = ['cmp_access_token', 'cmp_user_email', 'cmp_user_id', 'cmp_customer_id', 'cmp_department_id', 'cmp_portal_role', 'cmp_logged_in'] as const;

export function getAuthItem(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export function setAuthItem(key: string, value: string, persistent: boolean) {
  (persistent ? localStorage : sessionStorage).setItem(key, value);
}

export function removeAuthItem(key: string) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function clearAuth(persistent: boolean) {
  const storage = persistent ? localStorage : sessionStorage;
  KEYS.forEach(k => storage.removeItem(k));
}
