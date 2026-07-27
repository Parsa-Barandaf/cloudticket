import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_CUSTOMERS, DELETE_CUSTOMER } from '../api/queries';
import type { ApiCustomer } from '../api/types';
import type { Customer } from '../types';
import { mapCustomer } from '../api/transform';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ customers: ApiCustomer[] }>(GET_CUSTOMERS);
      setCustomers(data.customers.map(mapCustomer));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    await gql<{ deleteCustomer: boolean }>(DELETE_CUSTOMER, { id });
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return { customers, loading, error, refetch: fetchCustomers, deleteCustomer };
}
