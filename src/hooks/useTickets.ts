import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_TICKETS, CREATE_TICKET } from '../api/queries';
import type { Ticket } from '../types';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ tickets: Ticket[] }>(GET_TICKETS);
      setTickets(data.tickets);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (input: {
    title: string;
    priority: string;
    customerId: string;
  }) => {
    try {
      await gql(CREATE_TICKET, { input });
      await fetchTickets();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchTickets]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets, createTicket };
}
