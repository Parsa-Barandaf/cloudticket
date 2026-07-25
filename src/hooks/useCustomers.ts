import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_CUSTOMERS } from '../api/queries';
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

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return { customers, loading, error, refetch: fetchCustomers };
}
