import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_CUSTOM_ROLES, CREATE_CUSTOM_ROLE, UPDATE_CUSTOM_ROLE, DELETE_CUSTOM_ROLE } from '../api/queries';
import type { ApiCustomRole } from '../api/types';

export function useCustomRoles() {
  const [roles, setRoles] = useState<ApiCustomRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ customRoles: ApiCustomRole[] }>(GET_CUSTOM_ROLES);
      setRoles(data.customRoles);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (input: { name: string; description?: string; permissions?: string }) => {
    const data = await gql<{ createCustomRole: ApiCustomRole }>(CREATE_CUSTOM_ROLE, { input });
    setRoles(prev => [data.createCustomRole, ...prev]);
    return data.createCustomRole;
  }, []);

  const updateRole = useCallback(async (input: { id: string; name?: string; description?: string; permissions?: string }) => {
    const data = await gql<{ updateCustomRole: ApiCustomRole }>(UPDATE_CUSTOM_ROLE, { input });
    setRoles(prev => prev.map(r => r.id === input.id ? data.updateCustomRole : r));
    return data.updateCustomRole;
  }, []);

  const deleteRole = useCallback(async (id: string, reassignRoleId?: string) => {
    await gql<{ deleteCustomRole: boolean }>(DELETE_CUSTOM_ROLE, { input: { id, reassignRoleId } });
    setRoles(prev => prev.filter(r => r.id !== id));
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  return { roles, loading, error, refetch: fetchRoles, createRole, updateRole, deleteRole };
}
