import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_TICKETS, CREATE_TICKET, UPDATE_TICKET_STATUS } from '../api/queries';
import type { ApiTicket } from '../api/types';
import type { Ticket } from '../types';
import { mapTicket } from '../api/transform';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ tickets: ApiTicket[] }>(GET_TICKETS);
      setTickets(data.tickets.map(mapTicket));
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

  const updateTicketStatus = useCallback(async (id: string, status: string) => {
    try {
      await gql(UPDATE_TICKET_STATUS, { input: { id, status } });
      await fetchTickets();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchTickets]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets, createTicket, updateTicketStatus };
}
