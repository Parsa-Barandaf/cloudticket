const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql';

async function getToken(): Promise<string | null> {
  return localStorage.getItem('cmp_access_token');
}

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    const message = json.errors[0]?.message || 'GraphQL error';
    throw new Error(message);
  }

  return json.data as T;
}
