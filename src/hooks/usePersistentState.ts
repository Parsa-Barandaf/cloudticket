import { useEffect, useState } from 'react';
import { getAuthItem, setAuthItem } from '../api/storage';

export function usePersistentState<T extends string>(key: string, defaultValue: T, allowedValues: readonly T[]) {
  const [value, setValue] = useState<T>(() => {
    const saved = getAuthItem(key) as T | null;
    return saved && allowedValues.includes(saved) ? saved : defaultValue;
  });

  useEffect(() => {
    const persistent = !!localStorage.getItem('cmp_access_token');
    setAuthItem(key, value, persistent);
  }, [key, value]);

  return [value, setValue] as const;
}
