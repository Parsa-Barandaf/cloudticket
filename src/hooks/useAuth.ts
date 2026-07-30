import { useState, useCallback } from 'react';
import { gql } from '../api/graphql';
import { LOGIN_MUTATION, GET_CURRENT_USER } from '../api/queries';
import type { ApiUser } from '../api/types';
import type { PortalRole } from '../types';

interface LoginResult {
  accessToken: string;
  user: { id: string; email: string; name: string; role: string; customRoleId?: string | null; portalType?: string | null };
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
      let portalRole: PortalRole;
      if (user.portalType === 'support') {
        portalRole = 'agent';
      } else if (user.portalType === 'management') {
        portalRole = 'admin';
      } else {
        portalRole = user.role.toLowerCase() as PortalRole;
      }
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
      const data = await gql<{ me: ApiUser }>(GET_CURRENT_USER);
      const user = data.me;
      let portalRole: PortalRole;
      if (user.portalType === 'support') {
        portalRole = 'agent';
      } else if (user.portalType === 'management') {
        portalRole = 'admin';
      } else {
        portalRole = user.role.toLowerCase() as PortalRole;
      }
      localStorage.setItem('cmp_portal_role', portalRole);
      localStorage.setItem('cmp_user_email', user.email);
      return { email: user.email, role: portalRole };
    } catch {
      return null;
    }
  }, []);

  return { login, logout, loading, error, getCurrentUser };
}
