import { useState, useCallback } from 'react';
import { gql } from '../api/graphql';
import { LOGIN_MUTATION } from '../api/queries';
import type { PortalRole } from '../types';

interface LoginResult {
  accessToken: string;
  user: { id: string; email: string; name: string; role: string };
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
      localStorage.setItem('cmp_portal_role', data.login.user.role.toLowerCase());

      const role = data.login.user.role.toLowerCase() as PortalRole;
      return { email: data.login.user.email, role };
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
    localStorage.setItem('cmp_logged_in', 'false');
  }, []);

  return { login, logout, loading, error };
}
