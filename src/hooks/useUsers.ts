import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_USERS, CREATE_USER, UPDATE_USER, DELETE_USER } from '../api/queries';
import type { ApiUser } from '../api/types';

export function useUsers() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ users: ApiUser[] }>(GET_USERS);
      setUsers(data.users);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (input: { email: string; password: string; name: string; phone?: string; company?: string; isCustomer?: boolean; departmentId?: string; roleId?: string; role?: string; active?: boolean }) => {
    const data = await gql<{ createUser: ApiUser }>(CREATE_USER, { input });
    setUsers(prev => [data.createUser, ...prev]);
    return data.createUser;
  }, []);

  const updateUser = useCallback(async (input: { id: string; name?: string; email?: string; phone?: string; company?: string; isCustomer?: boolean; departmentId?: string; roleId?: string; role?: string; active?: boolean }) => {
    const data = await gql<{ updateUser: ApiUser }>(UPDATE_USER, { input });
    setUsers(prev => prev.map(u => u.id === input.id ? data.updateUser : u));
    return data.updateUser;
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await gql<{ deleteUser: boolean }>(DELETE_USER, { id });
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers, createUser, updateUser, deleteUser };
}
