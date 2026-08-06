import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import {
  GET_NOTIFICATIONS,
  CREATE_NOTIFICATION,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  TOGGLE_NOTIFICATION_ARCHIVE,
  DELETE_NOTIFICATION,
  DELETE_NOTIFICATIONS,
} from '../api/queries';
import type { ApiNotification } from '../api/types';
import type { NotificationItem } from '../types';
import { mapNotification } from '../api/transform';

export interface CreateNotificationInput {
  title: string;
  description: string;
  type: string;
  priority?: string;
  authorName?: string;
  authorAvatarBg?: string;
  detailedContent?: string;
  linkedType?: string;
  linkedId?: string;
  linkedName?: string;
}

export function useNotifications(limit = 100, includeArchived = false) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ notifications: ApiNotification[] }>(GET_NOTIFICATIONS, {
        limit,
        includeArchived,
      });
      if (Array.isArray(data?.notifications)) {
        setNotifications(data.notifications.map(mapNotification));
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [limit, includeArchived]);

  const createNotification = useCallback(async (input: CreateNotificationInput) => {
    const data = await gql<{ createNotification: ApiNotification }>(CREATE_NOTIFICATION, { input });
    return data.createNotification;
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      await gql(MARK_NOTIFICATION_READ, { id });
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await gql(MARK_ALL_NOTIFICATIONS_READ);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const toggleArchive = useCallback(async (id: string) => {
    try {
      await gql(TOGGLE_NOTIFICATION_ARCHIVE, { id });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, archived: !n.archived } : n)),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await gql(DELETE_NOTIFICATION, { id });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const removeMany = useCallback(async (ids: string[]) => {
    try {
      await gql(DELETE_NOTIFICATIONS, { input: { ids } });
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    createNotification,
    markRead,
    markAllRead,
    toggleArchive,
    remove,
    removeMany,
  };
}
