import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import {
  GET_ROLES,
  CREATE_ROLE,
  UPDATE_ROLE,
  DELETE_ROLE,
  GET_PORTALS,
  GET_PERMISSIONS,
  GET_PERMISSIONS_BY_PORTAL,
  GET_USER_ROLES,
  ASSIGN_ROLE_TO_USER,
  UNASSIGN_ROLE_FROM_USER,
} from '../api/queries';
import type { ApiRole, ApiPermission, ApiPortal } from '../api/types';

export function useRoles() {
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [portals, setPortals] = useState<ApiPortal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ roles: ApiRole[] }>(GET_ROLES);
      setRoles(data.roles);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async (portalId?: string) => {
    try {
      if (portalId) {
        const data = await gql<{ permissionsByPortal: ApiPermission[] }>(GET_PERMISSIONS_BY_PORTAL, { portalId });
        setPermissions(data.permissionsByPortal);
      } else {
        const data = await gql<{ permissions: ApiPermission[] }>(GET_PERMISSIONS);
        setPermissions(data.permissions);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const fetchPortals = useCallback(async () => {
    try {
      const data = await gql<{ portals: ApiPortal[] }>(GET_PORTALS);
      setPortals(data.portals);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const createRole = useCallback(async (input: { name: string; description?: string; scope?: string; portalIds?: string[]; permissionIds?: string[] }) => {
    const data = await gql<{ createRole: ApiRole }>(CREATE_ROLE, { input });
    setRoles(prev => [data.createRole, ...prev]);
    return data.createRole;
  }, []);

  const updateRole = useCallback(async (input: { id: string; name?: string; description?: string; portalIds?: string[]; permissionIds?: string[] }) => {
    const data = await gql<{ updateRole: ApiRole }>(UPDATE_ROLE, { input });
    setRoles(prev => prev.map(r => r.id === input.id ? data.updateRole : r));
    return data.updateRole;
  }, []);

  const deleteRole = useCallback(async (id: string, reassignRoleId?: string) => {
    await gql<{ deleteRole: boolean }>(DELETE_ROLE, { id, reassignRoleId });
    setRoles(prev => prev.filter(r => r.id !== id));
  }, []);

  const getUserRoles = useCallback(async (userId: string) => {
    const data = await gql<{ userRoles: ApiRole[] }>(GET_USER_ROLES, { userId });
    return data.userRoles;
  }, []);

  const assignRoleToUser = useCallback(async (userId: string, roleId: string) => {
    const data = await gql<{ assignRoleToUser: ApiRole[] }>(ASSIGN_ROLE_TO_USER, { input: { userId, roleId } });
    return data.assignRoleToUser;
  }, []);

  const unassignRoleFromUser = useCallback(async (userId: string, roleId: string) => {
    const data = await gql<{ unassignRoleFromUser: ApiRole[] }>(UNASSIGN_ROLE_FROM_USER, { input: { userId, roleId } });
    return data.unassignRoleFromUser;
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  return {
    roles, permissions, portals, loading, error,
    refetchRoles: fetchRoles,
    fetchPermissions, fetchPortals,
    createRole, updateRole, deleteRole,
    getUserRoles, assignRoleToUser, unassignRoleFromUser,
  };
}
