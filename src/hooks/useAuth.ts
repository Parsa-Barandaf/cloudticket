import { useState, useCallback } from 'react';
import { gql } from '../api/graphql';
import { LOGIN_MUTATION, GET_CURRENT_USER } from '../api/queries';
import type { ApiUser } from '../api/types';
import type { PortalRole } from '../types';

interface LoginResult {
  accessToken: string;
  accessiblePortals: string[];
  permissions: string[];
  user: { id: string; email: string; name: string; role: string; isCustomer: boolean };
}

function resolvePortalRole(accessiblePortals: string[], fallbackRole: string): PortalRole {
  if (accessiblePortals.includes('main')) return 'admin';
  if (accessiblePortals.includes('support')) return 'agent';
  if (accessiblePortals.includes('customer')) return 'customer';
  return (fallbackRole.toLowerCase() as PortalRole) || 'customer';
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (
    email: string,
    password: string,
  ): Promise<{ email: string; role: PortalRole } | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await gql<{ login: LoginResult }>(LOGIN_MUTATION, { email, password });
      localStorage.setItem('cmp_access_token', data.login.accessToken);
      localStorage.setItem('cmp_user_email', data.login.user.email);

      const user = data.login.user;
      const portalRole = resolvePortalRole(data.login.accessiblePortals, user.role);
      localStorage.setItem('cmp_portal_role', portalRole);

      return { email: user.email, role: portalRole };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در برقراری ارتباط با سرور';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cmp_access_token');
    localStorage.removeItem('cmp_user_email');
    localStorage.removeItem('cmp_portal_role');
    localStorage.removeItem('cmp_logged_in');
  }, []);

  const getCurrentUser = useCallback(async (): Promise<{ email: string; role: PortalRole } | null> => {
    try {
      const data = await gql<{ me: { accessiblePortals: string[]; permissions: string[]; user: ApiUser } }>(GET_CURRENT_USER);
      const user = data.me.user;
      const portalRole = resolvePortalRole(data.me.accessiblePortals, user.role);
      localStorage.setItem('cmp_portal_role', portalRole);
      localStorage.setItem('cmp_user_email', user.email);
      return { email: user.email, role: portalRole };
    } catch {
      return null;
    }
  }, []);

  return { login, logout, loading, error, getCurrentUser };
}
