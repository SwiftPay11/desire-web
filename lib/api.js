const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is missing. Add it to your environment file.',
  );
}

export async function apiFetch(endpoint, options = {}) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('desire_token')
      : null;

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || `Request failed with status ${response.status}`;

    const error = new Error(message);

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export function getApiUrl(endpoint = '') {
  if (!endpoint) {
    return API_URL;
  }

  return `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

export default apiFetch;