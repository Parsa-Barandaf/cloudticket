import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_ACTIVITIES } from '../api/queries';
import type { ApiActivity } from '../api/types';
import type { ActivityItem } from '../types';
import { mapActivity } from '../api/transform';

export function useActivities(limit = 20) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ activities: ApiActivity[] }>(GET_ACTIVITIES, { limit });
      if (Array.isArray(data?.activities)) {
        setActivities(data.activities.map(mapActivity));
      }
    } catch (e) {
      console.error('Failed to fetch activities:', e);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
}
