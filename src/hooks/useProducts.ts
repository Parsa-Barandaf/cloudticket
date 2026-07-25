import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import { GET_PRODUCTS } from '../api/queries';
import type { ApiProduct } from '../api/types';
import type { Product } from '../types';
import { mapProduct } from '../api/transform';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<{ products: ApiProduct[] }>(GET_PRODUCTS);
      setProducts(data.products.map(mapProduct));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
