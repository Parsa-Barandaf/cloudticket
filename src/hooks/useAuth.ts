import { useState, useCallback } from 'react';
import { gql } from '../api/graphql';
import { LOGIN_MUTATION, GET_CURRENT_USER } from '../api/queries';
import { getAuthItem, setAuthItem, clearAuth } from '../api/storage';
import type { ApiUser } from '../api/types';
import type { PortalRole } from '../types';

interface LoginResult {
  accessToken: string;
  accessiblePortals: string[];
  permissions: string[];
  user: { id: string; email: string; name: string; role: string; isCustomer: boolean; customerId?: string; departmentId?: string };
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
    rememberMe?: boolean,
  ): Promise<{ email: string; role: PortalRole; userId?: string; customerId?: string; departmentId?: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await gql<{ login: LoginResult }>(LOGIN_MUTATION, { email, password, rememberMe });
      const persistent = !!rememberMe;
      setAuthItem('cmp_access_token', data.login.accessToken, persistent);
      setAuthItem('cmp_user_email', data.login.user.email, persistent);
      setAuthItem('cmp_user_id', data.login.user.id, persistent);
      if (data.login.user.customerId) setAuthItem('cmp_customer_id', data.login.user.customerId, persistent);
      if (data.login.user.departmentId) setAuthItem('cmp_department_id', data.login.user.departmentId, persistent);

      const user = data.login.user;
      const portalRole = resolvePortalRole(data.login.accessiblePortals, user.role);
      setAuthItem('cmp_portal_role', portalRole, persistent);

      return { email: user.email, role: portalRole, userId: user.id, customerId: user.customerId, departmentId: user.departmentId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در برقراری ارتباط با سرور';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth(true);
    clearAuth(false);
  }, []);

  const getCurrentUser = useCallback(async (): Promise<{ email: string; role: PortalRole; userId?: string; customerId?: string; departmentId?: string } | null> => {
    try {
      const data = await gql<{ me: { accessiblePortals: string[]; permissions: string[]; user: ApiUser } }>(GET_CURRENT_USER);
      const user = data.me.user;
      const portalRole = resolvePortalRole(data.me.accessiblePortals, user.role);
      const persistent = !!getAuthItem('cmp_access_token');
      setAuthItem('cmp_portal_role', portalRole, persistent);
      setAuthItem('cmp_user_email', user.email, persistent);
      setAuthItem('cmp_user_id', user.id, persistent);
      if (user.customerId) setAuthItem('cmp_customer_id', user.customerId, persistent);
      if (user.departmentId) setAuthItem('cmp_department_id', user.departmentId, persistent);
      return { email: user.email, role: portalRole, userId: user.id, customerId: user.customerId, departmentId: user.departmentId };
    } catch {
      return null;
    }
  }, []);

  return { login, logout, loading, error, getCurrentUser };
}
