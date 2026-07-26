import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_DEPARTMENTS, CREATE_DEPARTMENT, UPDATE_DEPARTMENT, DELETE_DEPARTMENT } from '../api/queries';
import type { ApiDepartment } from '../api/types';

export function useDepartments() {
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ departments: ApiDepartment[] }>(GET_DEPARTMENTS);
      setDepartments(data.departments);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = useCallback(async (input: { name: string; lead: string; assignedProducts: string[] }) => {
    const data = await gql<{ createDepartment: ApiDepartment }>(CREATE_DEPARTMENT, { input });
    setDepartments(prev => [data.createDepartment, ...prev]);
    return data.createDepartment;
  }, []);

  const updateDepartment = useCallback(async (input: { id: string; name?: string; lead?: string; assignedProducts?: string[] }) => {
    const data = await gql<{ updateDepartment: ApiDepartment }>(UPDATE_DEPARTMENT, { input });
    setDepartments(prev => prev.map(d => d.id === input.id ? data.updateDepartment : d));
    return data.updateDepartment;
  }, []);

  const deleteDepartment = useCallback(async (id: string) => {
    await gql<{ deleteDepartment: boolean }>(DELETE_DEPARTMENT, { id });
    setDepartments(prev => prev.filter(d => d.id !== id));
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  return { departments, loading, error, refetch: fetchDepartments, createDepartment, updateDepartment, deleteDepartment };
}
