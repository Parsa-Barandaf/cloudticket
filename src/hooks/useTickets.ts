import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_TICKETS, GET_TICKET, CREATE_TICKET, UPDATE_TICKET_STATUS, UPDATE_TICKET, CREATE_TICKET_MESSAGE, DELETE_TICKET, DELETE_TICKETS } from '../api/queries';
import type { ApiTicket, ApiTicketMessage } from '../api/types';
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

  const fetchTicket = useCallback(async (id: string) => {
    const data = await gql<{ ticket: ApiTicket }>(GET_TICKET, { id });
    return data.ticket;
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

  const updateTicket = useCallback(async (input: {
    id: string;
    title?: string;
    priority?: string;
    status?: string;
    assignedToId?: string;
    productId?: string;
  }) => {
    try {
      await gql(UPDATE_TICKET, { input });
      await fetchTickets();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchTickets]);

  const createTicketMessage = useCallback(async (input: {
    ticketId: string;
    text: string;
    senderName: string;
    isInternal?: boolean;
  }) => {
    const data = await gql<{ createTicketMessage: ApiTicketMessage }>(CREATE_TICKET_MESSAGE, { input });
    return data.createTicketMessage;
  }, []);

  const deleteTicket = useCallback(async (id: string) => {
    try {
      await gql(DELETE_TICKET, { id });
      await fetchTickets();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchTickets]);

  const deleteTickets = useCallback(async (ids: string[]) => {
    try {
      await gql(DELETE_TICKETS, { input: { ids } });
      await fetchTickets();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchTickets]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets, fetchTicket, createTicket, updateTicketStatus, updateTicket, createTicketMessage, deleteTicket, deleteTickets };
}
